import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Trip, TripStatus } from '@prisma/client';

type GeoJsonPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}
  async create(data: any): Promise<Trip> {
    const surgeMultiplier = data.surgeMultiplier ?? await this.getSurgeMultiplier(data.pickupLat, data.pickupLng);
    return this.prisma.trip.create({ data: { ...data, surgeMultiplier } });
  }
  async findByUserId(userId: string): Promise<Trip[]> {
    return this.prisma.trip.findMany({ where: { OR: [{ customerId: userId }, { driverId: userId }] }, include: { customer: true, driver: true } });
  }
  async updateStatus(id: string, status: TripStatus): Promise<Trip> { return this.prisma.trip.update({ where: { id }, data: { status } }); }
  async getSurgeMultiplier(lat?: number, lng?: number) {
    if (lat == null || lng == null) return 1;
    const activeZones = await this.prisma.surgeZone.findMany({
      where: { isActive: true, activeFrom: { lte: new Date() }, activeUntil: { gte: new Date() } },
      orderBy: { multiplier: 'desc' },
    });

    const activeZone = activeZones.find((zone) =>
      this.isPointInGeoJsonPolygon(lat, lng, zone.polygon),
    );

    return activeZone?.multiplier ?? 1;
  }

  private isPointInGeoJsonPolygon(lat: number, lng: number, polygon: unknown) {
    if (!this.isGeoJsonPolygon(polygon)) return false;
    const [outerRing, ...holes] = polygon.coordinates;

    if (!outerRing || !this.isPointInRing(lat, lng, outerRing)) return false;
    return !holes.some((ring) => this.isPointInRing(lat, lng, ring));
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
}
