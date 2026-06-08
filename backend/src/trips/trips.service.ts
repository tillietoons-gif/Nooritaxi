import { BadRequestException, Injectable } from '@nestjs/common';
import { DriverStatus, PaymentMethod, Trip, TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PushService } from '../push/push.service';
import {
  assertTripStatusTransition,
  tripStatusTimestampData,
} from './trip-status-machine';
import { WalletService } from '../wallet/wallet.service';
import { DispatchService } from '../dispatch/dispatch.service';

type GeoJsonPolygon = { type: 'Polygon'; coordinates: number[][][] };

@Injectable()
export class TripsService {
  constructor(
    private prisma: PrismaService,
    private push: PushService,
    private wallet: WalletService,
    private dispatch: DispatchService,
  ) {}

  async createRide(data: any) {
    const distance = data.distance ?? 5;
    const surgeMultiplier = await this.getSurgeMultiplier(
      data.pickupLat,
      data.pickupLng,
    );
    const { baseFare, fare } = this.estimateRideFare(distance, surgeMultiplier);

    const { ride, matchedDriverTokens } = await this.prisma.$transaction(
      async (tx) => {
        const createdRide = await tx.trip.create({
          data: {
            ...data,
            distance,
            baseFare,
            fare,
            surgeMultiplier,
            safetyCode:
              data.safetyCode ??
              Math.floor(1000 + Math.random() * 9000).toString(),
          },
        });

        const matchedDriver = data.driverId
          ? null
          : await this.dispatch.findNearestOnlineDriver(
              data.pickupLat,
              data.pickupLng,
              10,
              tx,
            );
        const assignedDriverUserId = data.driverId ?? matchedDriver?.userId;
        const assignedVehicleId =
          data.vehicleId ?? matchedDriver?.vehicles[0]?.id;

        if (!assignedDriverUserId)
          return { ride: createdRide, matchedDriverTokens: [] };

        const updatedRide = await tx.trip.update({
          where: { id: createdRide.id },
          data: {
            driverId: assignedDriverUserId,
            vehicleId: assignedVehicleId,
            status: TripStatus.ACCEPTED,
            acceptedAt: new Date(),
          },
        });

        await tx.driver.updateMany({
          where: { userId: assignedDriverUserId },
          data: { status: DriverStatus.BUSY },
        });

        const devices = await tx.pushDevice.findMany({
          where: { userId: assignedDriverUserId, isActive: true },
          select: { token: true },
        });

        return {
          ride: updatedRide,
          matchedDriverTokens: devices.map((device: any) => device.token),
        };
      },
    );

    if (matchedDriverTokens.length) {
      await this.push.sendToTokens(
        matchedDriverTokens,
        'New ride request',
        `${ride.pickupLocation} to ${ride.dropoffLocation}`,
        { type: 'RIDE_REQUEST', tripId: ride.id },
      );
    }

    await this.audit('RIDE_CREATED', 'Trip', ride.id, data.customerId, ride);
    return ride;
  }

  async getRideEstimate(distance = 5, lat?: number, lng?: number) {
    const surgeMultiplier = await this.getSurgeMultiplier(lat, lng);
    return this.estimateRideFare(distance, surgeMultiplier);
  }

  listRides(userId?: string, page = 1, limit = 25) {
    return this.prisma.trip.findMany({
      where: userId
        ? { OR: [{ customerId: userId }, { driverId: userId }] }
        : {},
      include: { customer: true, driver: true, vehicle: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRide(id: string, data: any) {
    const { ride, before } = await this.prisma.$transaction(async (tx) => {
      const before = await tx.trip.findUnique({ where: { id } });
      const { actorId: _, ...rideData } = data;

      if (before && rideData.status) {
        assertTripStatusTransition(before.status, rideData.status);
        if (before.status !== rideData.status) {
          Object.assign(rideData, tripStatusTimestampData(rideData.status));
        }
      }

      const ride = await tx.trip.update({ where: { id }, data: rideData });

      if (
        before &&
        before.status !== 'COMPLETED' &&
        ride.status === 'COMPLETED'
      ) {
        await this.settleCompletedRide(ride, tx);
      }

      if (
        before &&
        before.status !== ride.status &&
        this.isTerminalTripStatus(ride.status) &&
        ride.driverId
      ) {
        await tx.driver.updateMany({
          where: { userId: ride.driverId },
          data: {
            status: DriverStatus.ONLINE,
            ...(ride.status === TripStatus.COMPLETED
              ? { completedTrips: { increment: 1 } }
              : {}),
          },
        });
      }

      return { ride, before };
    });

    await this.audit('RIDE_UPDATED', 'Trip', id, data.actorId, ride, before);
    return ride;
  }

  private async getSurgeMultiplier(lat?: number, lng?: number) {
    if (lat == null || lng == null) return 1;
    const activeZones = await this.prisma.surgeZone.findMany({
      where: {
        isActive: true,
        activeFrom: { lte: new Date() },
        activeUntil: { gte: new Date() },
      },
      orderBy: { multiplier: 'desc' },
    });

    const activeZone = activeZones.find((zone) =>
      this.isPointInGeoJsonPolygon(lat, lng, zone.polygon),
    );

    return activeZone?.multiplier ?? 1;
  }

  private estimateRideFare(distance = 5, surgeMultiplier = 1) {
    const safeDistance = Number.isFinite(Number(distance))
      ? Number(distance)
      : 5;
    const safeSurge = Number.isFinite(Number(surgeMultiplier))
      ? Number(surgeMultiplier)
      : 1;
    const baseFare = 80;
    const perKm = 35;
    const fare = Math.round((baseFare + safeDistance * perKm) * safeSurge);
    return {
      baseFare,
      perKm,
      distance: safeDistance,
      surgeMultiplier: safeSurge,
      fare,
      currency: 'AFN',
    };
  }

  private isTerminalTripStatus(status: TripStatus) {
    return status === TripStatus.COMPLETED || status === TripStatus.CANCELLED;
  }

  private isPointInGeoJsonPolygon(lat: number, lng: number, polygon: unknown) {
    if (!this.isGeoJsonPolygon(polygon)) return false;
    const [outerRing, ...holes] = polygon.coordinates;
    if (!outerRing) return false;

    // Performance Optimization: Bounding Box Pre-check
    // Fast O(1) check to skip O(N) Point-in-Polygon for distant zones
    if (!this.isPointInBoundingBox(lat, lng, outerRing)) return false;

    if (!this.isPointInRing(lat, lng, outerRing)) return false;
    return !holes.some((ring) => this.isPointInRing(lat, lng, ring));
  }

  private isPointInBoundingBox(lat: number, lng: number, ring: number[][]) {
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;
    for (const [rLng, rLat] of ring) {
      if (rLat < minLat) minLat = rLat;
      if (rLat > maxLat) maxLat = rLat;
      if (rLng < minLng) minLng = rLng;
      if (rLng > maxLng) maxLng = rLng;
    }
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  }

  private isGeoJsonPolygon(value: unknown): value is GeoJsonPolygon {
    if (!value || typeof value !== 'object') return false;
    const polygon = value as Partial<GeoJsonPolygon>;
    return polygon.type === 'Polygon' && Array.isArray(polygon.coordinates);
  }

  private isPointInRing(lat: number, lng: number, ring: number[][]) {
    let isInside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [lngI, latI] = ring[i];
      const [lngJ, latJ] = ring[j];
      const intersects =
        latI > lat !== latJ > lat &&
        lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;
      if (intersects) isInside = !isInside;
    }
    return isInside;
  }

  private async settleCompletedRide(ride: Trip, tx: any) {
    if (ride.paymentMethod !== PaymentMethod.WALLET) return;
    if (!ride.driverId)
      throw new BadRequestException(
        'Cannot settle wallet ride without an assigned driver',
      );
    const amount = Number(ride.fare ?? 0);
    if (!Number.isFinite(amount) || amount <= 0)
      throw new BadRequestException(
        'Cannot settle wallet ride without a positive fare',
      );
    await this.wallet.transfer(
      ride.customerId,
      amount,
      `Ride payment for ${ride.id}`,
      `ride:${ride.id}:wallet-payment`,
      { tx, transactionType: 'RIDE_PAYMENT', tripId: ride.id },
    );
    await this.wallet.deposit(
      ride.driverId,
      amount,
      'DRIVER',
      'AFN',
      `ride:${ride.id}:driver-payout`,
      {
        tx,
        transactionType: 'DRIVER_PAYOUT',
        description: `Driver payout for ride ${ride.id}`,
        tripId: ride.id,
      },
    );
  }

  private async audit(
    action: string,
    entityType: string,
    entityId?: string,
    actorId?: string,
    after?: any,
    before?: any,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        actorId,
        before: before ?? undefined,
        after: after ?? undefined,
      },
    });
  }
}
