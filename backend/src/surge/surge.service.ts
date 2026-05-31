import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SurgeService {
  constructor(private prisma: PrismaService) {}

  async createZone(data: {
    name: string;
    multiplier: number;
    radiusKm: number;
    centerLat: number;
    centerLng: number;
    isActive: boolean;
    activeFrom: Date;
    activeUntil: Date;
  }) {
    // We mock the polygon creation as a square around the center for simplicity
    const offset = data.radiusKm * 0.01; // ~1km in degrees
    const polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [data.centerLng - offset, data.centerLat - offset],
          [data.centerLng + offset, data.centerLat - offset],
          [data.centerLng + offset, data.centerLat + offset],
          [data.centerLng - offset, data.centerLat + offset],
          [data.centerLng - offset, data.centerLat - offset],
        ],
      ],
    };

    return this.prisma.surgeZone.create({
      data: {
        name: data.name,
        city: 'Kabul', // Hardcoded for MVP
        multiplier: data.multiplier,
        isActive: data.isActive,
        activeFrom: data.activeFrom,
        activeUntil: data.activeUntil,
        polygon: polygon,
      },
    });
  }

  async getActiveZones() {
    const now = new Date();
    return this.prisma.surgeZone.findMany({
      where: {
        isActive: true,
        activeFrom: { lte: now },
        activeUntil: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllZones() {
    return this.prisma.surgeZone.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateZoneStatus(id: string, isActive: boolean, activeUntil?: Date) {
    const zone = await this.prisma.surgeZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundException('Surge zone not found');

    return this.prisma.surgeZone.update({
      where: { id },
      data: {
        isActive,
        ...(activeUntil ? { activeUntil } : {}),
      },
    });
  }

  // Calculates the current surge multiplier for a given location
  async getCurrentSurgeMultiplier(lat: number, lng: number): Promise<number> {
    const activeZones = await this.getActiveZones();
    let maxMultiplier = 1.0;

    for (const zone of activeZones) {
      if (zone.multiplier > maxMultiplier) {
        // Simple bounding box check for MVP
        try {
          const poly = zone.polygon as any;
          if (poly && poly.coordinates && poly.coordinates[0]) {
            const coords = poly.coordinates[0];
            const minLng = Math.min(...coords.map((c: any) => c[0]));
            const maxLng = Math.max(...coords.map((c: any) => c[0]));
            const minLat = Math.min(...coords.map((c: any) => c[1]));
            const maxLat = Math.max(...coords.map((c: any) => c[1]));

            if (
              lng >= minLng &&
              lng <= maxLng &&
              lat >= minLat &&
              lat <= maxLat
            ) {
              maxMultiplier = zone.multiplier;
            }
          }
        } catch (err) {
          // Ignore invalid polygons
        }
      }
    }

    return maxMultiplier;
  }
}
