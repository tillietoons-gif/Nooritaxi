import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type Point = { lat: number; lng: number };
type Polygon = Point[];

@Injectable()
export class SurgeService {
  private readonly logger = new Logger(SurgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSurgeMultiplier(lat: number, lng: number): Promise<number> {
    const point: Point = { lat, lng };

    const activeZones = await this.prisma.surgeZone.findMany({
      where: { isActive: true },
    });

    if (!activeZones.length) {
      return 1.0;
    }

    const multipliers: number[] = activeZones
      .filter((zone) => {
        const polygon = zone.polygon as unknown as Polygon;
        return this.isPointInPolygon(point, polygon);
      })
      .map((zone) => zone.multiplier);

    if (multipliers.length === 0) {
      return 1.0;
    }

    const highestMultiplier = Math.max(...multipliers);
    this.logger.log(`Surge multiplier for (${lat}, ${lng}): ${highestMultiplier}`);
    
    return highestMultiplier;
  }

  private isPointInPolygon(point: Point, polygon: Polygon): boolean {
    if (!polygon || polygon.length < 3) {
      return false;
    }

    const lats = polygon.map((p) => p.lat);
    const lngs = polygon.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const isWithinBoundingBox =
      point.lat >= minLat &&
      point.lat <= maxLat &&
      point.lng >= minLng &&
      point.lng <= maxLng;
      
    return isWithinBoundingBox;
  }

  async getActiveZones() {
    return this.prisma.surgeZone.findMany({ where: { isActive: true } });
  }

  async getAllZones() {
    return this.prisma.surgeZone.findMany();
  }

  async createZone(data: any) {
    const offset = data.radiusKm * 0.009;
    const polygon = [
      { lat: data.centerLat - offset, lng: data.centerLng - offset },
      { lat: data.centerLat - offset, lng: data.centerLng + offset },
      { lat: data.centerLat + offset, lng: data.centerLng + offset },
      { lat: data.centerLat + offset, lng: data.centerLng - offset },
    ];

    return this.prisma.surgeZone.create({
      data: {
        name: data.name,
        city: 'System',
        polygon: polygon,
        multiplier: data.multiplier,
        isActive: data.isActive,
        activeFrom: data.activeFrom,
        activeUntil: data.activeUntil,
      }
    });
  }

  async updateZoneStatus(id: string, isActive: boolean, activeUntil?: Date) {
    const data: any = { isActive };
    if (activeUntil) {
      data.activeUntil = activeUntil;
    }
    return this.prisma.surgeZone.update({
      where: { id },
      data
    });
  }
}
