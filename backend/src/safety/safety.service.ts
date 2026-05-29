import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SosStatus, TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PushService } from '../push/push.service';

export type CreateTrustedContactInput = {
  name: string;
  phone: string;
  relation?: string;
  notifyOnSos?: boolean;
  notifyOnTrip?: boolean;
};

export type RaiseSosInput = {
  tripId?: string;
  lat?: number;
  lng?: number;
  message?: string;
};

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(
    private prisma: PrismaService,
    private push: PushService,
    private config: ConfigService,
  ) {}

  // ---------------- Trusted contacts ----------------

  listContacts(userId: string) {
    return this.prisma.trustedContact.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addContact(userId: string, data: CreateTrustedContactInput) {
    if (!data.name?.trim())
      throw new BadRequestException('Contact name is required');
    if (!data.phone?.trim())
      throw new BadRequestException('Contact phone is required');

    return this.prisma.trustedContact.upsert({
      where: { userId_phone: { userId, phone: data.phone.trim() } },
      update: {
        name: data.name.trim(),
        relation: data.relation,
        notifyOnSos: data.notifyOnSos ?? true,
        notifyOnTrip: data.notifyOnTrip ?? false,
      },
      create: {
        userId,
        name: data.name.trim(),
        phone: data.phone.trim(),
        relation: data.relation,
        notifyOnSos: data.notifyOnSos ?? true,
        notifyOnTrip: data.notifyOnTrip ?? false,
      },
    });
  }

  async removeContact(userId: string, contactId: string) {
    const contact = await this.prisma.trustedContact.findUnique({
      where: { id: contactId },
    });
    if (!contact || contact.userId !== userId)
      throw new NotFoundException('Trusted contact not found');
    await this.prisma.trustedContact.delete({ where: { id: contactId } });
    return { id: contactId, removed: true };
  }

  // ---------------- SOS ----------------

  async raiseSos(userId: string, data: RaiseSosInput) {
    let resolvedTripId: string | undefined;
    let safetyCode: string | undefined;

    if (data.tripId) {
      const trip = await this.prisma.trip.findFirst({
        where: {
          id: data.tripId,
          OR: [{ customerId: userId }, { driverId: userId }],
        },
        select: { id: true, safetyCode: true },
      });
      if (!trip)
        throw new ForbiddenException('Trip is not assigned to this user');
      resolvedTripId = trip.id;
      safetyCode = trip.safetyCode ?? undefined;
    }

    const alert = await this.prisma.sosAlert.create({
      data: {
        userId,
        tripId: resolvedTripId,
        lat: data.lat,
        lng: data.lng,
        message: data.message,
      },
    });

    // Notify trusted contacts via push (SMS provider not configured yet — log instead).
    const contacts = await this.prisma.trustedContact.findMany({
      where: { userId, notifyOnSos: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true },
    });

    const shareUrl = safetyCode ? this.buildShareUrl(safetyCode) : null;
    const title = 'SOS triggered';
    const body = `${user?.name ?? 'A Noori user'} has triggered an SOS${
      shareUrl ? `. Track at ${shareUrl}` : ''
    }`;

    // Log to audit. Real SMS dispatch is out of scope for this PR.
    for (const contact of contacts) {
      this.logger.warn(
        `SOS notification queued: contact=${contact.phone} user=${userId} alert=${alert.id}`,
      );
    }

    // Push the alert to any admin/support dashboards listening.
    // (Reuses the existing socket gateway if connected; falls through silently if not.)
    try {
      const adminDevices = await this.prisma.pushDevice.findMany({
        where: {
          isActive: true,
          user: { role: { in: ['ADMIN', 'SUPPORT'] as any } },
        },
        select: { token: true },
      });
      if (adminDevices.length) {
        await this.push.sendToTokens(
          adminDevices.map((d) => d.token),
          title,
          body,
          {
            type: 'SOS',
            alertId: alert.id,
            ...(resolvedTripId ? { tripId: resolvedTripId } : {}),
          },
        );
      }
    } catch (err) {
      this.logger.error(
        `Failed to notify admins of SOS ${alert.id}: ${(err as Error).message}`,
      );
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'SOS_RAISED',
        entityType: 'SosAlert',
        entityId: alert.id,
        actorId: userId,
        after: { tripId: resolvedTripId, lat: data.lat, lng: data.lng },
      },
    });

    return { alert, notifiedContacts: contacts.length, shareUrl };
  }

  async resolveSos(alertId: string, actorId: string, isStaff: boolean) {
    const alert = await this.prisma.sosAlert.findUnique({
      where: { id: alertId },
    });
    if (!alert) throw new NotFoundException('SOS alert not found');
    if (alert.userId !== actorId && !isStaff)
      throw new ForbiddenException('Cannot resolve another user SOS');
    if (alert.status !== SosStatus.ACTIVE) return alert;

    const resolved = await this.prisma.sosAlert.update({
      where: { id: alertId },
      data: {
        status: SosStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: actorId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'SOS_RESOLVED',
        entityType: 'SosAlert',
        entityId: alertId,
        actorId,
        after: { resolvedAt: resolved.resolvedAt },
      },
    });
    return resolved;
  }

  listActiveSosAlerts() {
    return this.prisma.sosAlert.findMany({
      where: { status: SosStatus.ACTIVE },
      include: { user: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------- Public share ----------------

  async getPublicTripByCode(safetyCode: string) {
    if (!safetyCode || safetyCode.length < 3)
      throw new NotFoundException('Trip not found');

    const trip = await this.prisma.trip.findFirst({
      where: { safetyCode },
      select: {
        id: true,
        status: true,
        pickupLocation: true,
        pickupLat: true,
        pickupLng: true,
        dropoffLocation: true,
        dropoffLat: true,
        dropoffLng: true,
        requestedAt: true,
        acceptedAt: true,
        completedAt: true,
        cancelledAt: true,
        customer: { select: { name: true } },
        driver: {
          select: {
            name: true,
            driverProfile: {
              select: {
                currentLat: true,
                currentLng: true,
                ratingAverage: true,
              },
            },
          },
        },
        vehicle: {
          select: { plateNumber: true, make: true, model: true, color: true },
        },
      },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    // Don't expose live driver location once the trip is over.
    const isLive =
      trip.status !== TripStatus.COMPLETED &&
      trip.status !== TripStatus.CANCELLED;
    const driverLocation = isLive
      ? trip.driver?.driverProfile
        ? {
            lat: trip.driver.driverProfile.currentLat,
            lng: trip.driver.driverProfile.currentLng,
          }
        : null
      : null;

    return {
      id: trip.id,
      status: trip.status,
      isLive,
      pickup: {
        label: trip.pickupLocation,
        lat: trip.pickupLat,
        lng: trip.pickupLng,
      },
      dropoff: {
        label: trip.dropoffLocation,
        lat: trip.dropoffLat,
        lng: trip.dropoffLng,
      },
      requestedAt: trip.requestedAt,
      acceptedAt: trip.acceptedAt,
      completedAt: trip.completedAt,
      cancelledAt: trip.cancelledAt,
      rider: trip.customer?.name ? { name: trip.customer.name } : null,
      driver: trip.driver
        ? {
            name: trip.driver.name,
            rating: trip.driver.driverProfile?.ratingAverage ?? null,
            location: driverLocation,
          }
        : null,
      vehicle: trip.vehicle
        ? {
            plate: trip.vehicle.plateNumber,
            description: [
              trip.vehicle.color,
              trip.vehicle.make,
              trip.vehicle.model,
            ]
              .filter(Boolean)
              .join(' '),
          }
        : null,
    };
  }

  private buildShareUrl(safetyCode: string) {
    const base =
      this.config.get<string>('WEB_PUBLIC_URL') ?? 'https://noori.app';
    return `${base.replace(/\/$/, '')}/share/${safetyCode}`;
  }
}
