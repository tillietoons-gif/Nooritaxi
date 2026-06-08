import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type Point = { lat: number; lng: number };
type GeoJsonPolygon = { type: 'Polygon'; coordinates: number[][][] };

@Injectable()
export class SurgeService {
  private readonly logger = new Logger(SurgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSurgeMultiplier(lat: number, lng: number): Promise<number> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return 1.0;
    }

    const point: Point = { lat, lng };

    const activeZones = await this.prisma.surgeZone.findMany({
      where: {
        isActive: true,
        activeFrom: { lte: new Date() },
        activeUntil: { gte: new Date() },
      },
    });

    if (!activeZones.length) {
      return 1.0;
    }

    const multipliers: number[] = activeZones
      .filter((zone) => this.isPointInPolygon(point, zone.polygon))
      .map((zone) => zone.multiplier);

    if (multipliers.length === 0) {
      return 1.0;
    }

    const highestMultiplier = Math.max(...multipliers);
    this.logger.log(
      `Surge multiplier for (${lat}, ${lng}): ${highestMultiplier}`,
    );

    return highestMultiplier;
  }

  private isPointInPolygon(point: Point, polygon: unknown): boolean {
    const ring = this.getOuterRing(polygon);
    if (!ring || ring.length < 3) return false;
    if (!this.isPointInBoundingBox(point, ring)) return false;

    let isInside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [lngI, latI] = ring[i];
      const [lngJ, latJ] = ring[j];
      const intersects =
        latI > point.lat !== latJ > point.lat &&
        point.lng < ((lngJ - lngI) * (point.lat - latI)) / (latJ - latI) + lngI;
      if (intersects) isInside = !isInside;
    }
    return isInside;
  }

  async getActiveZones() {
    const zones = await this.prisma.surgeZone.findMany({
      where: {
        isActive: true,
        activeFrom: { lte: new Date() },
        activeUntil: { gte: new Date() },
      },
      orderBy: { multiplier: 'desc' },
    });
    return zones.map((zone) => this.toDto(zone));
  }

  async getAllZones() {
    const zones = await this.prisma.surgeZone.findMany({
      orderBy: [{ isActive: 'desc' }, { activeUntil: 'desc' }],
    });
    return zones.map((zone) => this.toDto(zone));
  }

  async createZone(data: any) {
    const name = String(data.name ?? '').trim();
    const centerLat = Number(data.centerLat);
    const centerLng = Number(data.centerLng);
    const radiusKm = Number(data.radiusKm);
    const multiplier = Number(data.multiplier);
    const activeFrom = new Date(data.activeFrom);
    const activeUntil = new Date(data.activeUntil);

    if (!name) throw new BadRequestException('Surge zone name is required');
    if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
      throw new BadRequestException('Valid center coordinates are required');
    }
    if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
      throw new BadRequestException('Radius must be greater than zero');
    }
    if (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 5) {
      throw new BadRequestException('Multiplier must be between 1 and 5');
    }
    if (
      Number.isNaN(activeFrom.getTime()) ||
      Number.isNaN(activeUntil.getTime())
    ) {
      throw new BadRequestException('Valid active dates are required');
    }
    if (activeUntil <= activeFrom) {
      throw new BadRequestException('Active until must be after active from');
    }

    const offset = radiusKm * 0.009;
    const polygon: GeoJsonPolygon = {
      type: 'Polygon',
      coordinates: [
        [
          [centerLng - offset, centerLat - offset],
          [centerLng + offset, centerLat - offset],
          [centerLng + offset, centerLat + offset],
          [centerLng - offset, centerLat + offset],
          [centerLng - offset, centerLat - offset],
        ],
      ],
    };

    const zone = await this.prisma.surgeZone.create({
      data: {
        name,
        city: 'System',
        polygon: polygon,
        multiplier,
        isActive: data.isActive ?? true,
        activeFrom,
        activeUntil,
      },
    });
    return this.toDto(zone);
  }

  async updateZoneStatus(id: string, isActive: boolean, activeUntil?: Date) {
    const data: any = { isActive };
    if (activeUntil) {
      if (Number.isNaN(activeUntil.getTime())) {
        throw new BadRequestException('Valid activeUntil is required');
      }
      data.activeUntil = activeUntil;
    }
    try {
      const zone = await this.prisma.surgeZone.update({
        where: { id },
        data,
      });
      return this.toDto(zone);
    } catch {
      throw new NotFoundException('Surge zone not found');
    }
  }

  private getOuterRing(polygon: unknown): number[][] | null {
    if (!polygon || typeof polygon !== 'object') return null;
    const candidate = polygon as Partial<GeoJsonPolygon>;
    if (candidate.type === 'Polygon' && Array.isArray(candidate.coordinates)) {
      return candidate.coordinates[0] ?? null;
    }

    if (Array.isArray(polygon)) {
      const legacyPoints = polygon as Point[];
      if (
        !legacyPoints.every(
          (point) =>
            typeof point.lat === 'number' && typeof point.lng === 'number',
        )
      ) {
        return null;
      }
      return legacyPoints.map((point) => [point.lng, point.lat]);
    }

    return null;
  }

  private isPointInBoundingBox(point: Point, ring: number[][]) {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    for (const [lng, lat] of ring) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
    return (
      point.lat >= minLat &&
      point.lat <= maxLat &&
      point.lng >= minLng &&
      point.lng <= maxLng
    );
  }

  private toDto(zone: any) {
    const ring = this.getOuterRing(zone.polygon) ?? [];
    const first = ring[0];
    const last = ring[ring.length - 1];
    const isClosed =
      first && last && first[0] === last[0] && first[1] === last[1];
    const uniqueRing = isClosed ? ring.slice(0, -1) : ring;
    const lats = uniqueRing.map(([, lat]) => lat);
    const lngs = uniqueRing.map(([lng]) => lng);
    const minLat = lats.length ? Math.min(...lats) : null;
    const maxLat = lats.length ? Math.max(...lats) : null;
    const minLng = lngs.length ? Math.min(...lngs) : null;
    const maxLng = lngs.length ? Math.max(...lngs) : null;
    const centerLat =
      minLat == null || maxLat == null ? null : (minLat + maxLat) / 2;
    const centerLng =
      minLng == null || maxLng == null ? null : (minLng + maxLng) / 2;
    const radiusKm =
      minLat == null || maxLat == null
        ? null
        : Math.abs(maxLat - minLat) / 2 / 0.009;
    const isCurrentlyActive = Boolean(
      zone.isActive &&
      zone.activeFrom <= new Date() &&
      zone.activeUntil >= new Date(),
    );

    return {
      ...zone,
      centerLat,
      centerLng,
      radiusKm,
      isCurrentlyActive,
    };
  }
}
