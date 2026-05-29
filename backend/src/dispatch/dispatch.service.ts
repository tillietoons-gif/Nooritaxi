import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Driver } from '@prisma/client';

@Injectable()
export class DispatchService {
  constructor(private prisma: PrismaService) {}

  async findNearestOnlineDriver(pickupLat: number, pickupLng: number, maxDistanceKm = 10, tx: any = this.prisma) {
    // 1. Calculate bounding box for spatial pre-filtering
    const bbox = this.calculateBoundingBox(pickupLat, pickupLng, maxDistanceKm);

    // 2. Fetch online drivers within the bounding box
    // This allows the database to use the index on [currentLat, currentLng]
    const drivers = await (tx.driver as any).findMany({
      where: {
        status: 'ONLINE',
        currentLat: { gte: bbox.minLat, lte: bbox.maxLat },
        currentLng: { gte: bbox.minLng, lte: bbox.maxLng },
      },
      include: { vehicles: { where: { isActive: true }, take: 1 } },
      // Still take a reasonable amount to avoid over-fetching if area is dense
      take: 100,
    });

    // 3. Filter and sort by exact distance (Haversine)
    const sortedDrivers = drivers
      .map((driver: Driver & { vehicles: { id: string }[] }) => ({
        driver,
        distance: driver.currentLat != null && driver.currentLng != null
            ? this.distanceKm(pickupLat, pickupLng, driver.currentLat, driver.currentLng)
            : Infinity,
      }))
      .filter((d: { distance: number }) => d.distance <= maxDistanceKm)
      .sort((a: { distance: number, driver: Driver }, b: { distance: number, driver: Driver }) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        return b.driver.ratingAverage - a.driver.ratingAverage;
      });

    // 4. Simulate OSRM/Routing API check for real ETA on the top 3 drivers
    const topCandidates = sortedDrivers.slice(0, 3);
    // Optimization: Run routing checks in parallel
    await Promise.all(
      topCandidates.map(async (candidate: any) => {
        candidate.distance = await this.calculateRouteDistance(
          pickupLat,
          pickupLng,
          candidate.driver.currentLat!,
          candidate.driver.currentLng!
        );
      })
    );

    topCandidates.sort((a: any, b: any) => a.distance - b.distance);

    return topCandidates[0]?.driver;
  }

  private calculateBoundingBox(lat: number, lng: number, distanceKm: number) {
    const latDelta = distanceKm / 111;
    const lngDelta = distanceKm / (111 * Math.cos(this.toRadians(lat)));
    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta,
    };
  }

  // Mock integration with OSRM/Google Maps for actual road distance
  private async calculateRouteDistance(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<number> {
    const straightLine = this.distanceKm(fromLat, fromLng, toLat, toLng);
    // Road distance is typically 1.2x to 1.4x straight line distance
    const routingMultiplier = 1.3;
    return straightLine * routingMultiplier;
  }

  private distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
    const earthRadiusKm = 6371;
    const dLat = this.toRadians(toLat - fromLat);
    const dLng = this.toRadians(toLng - fromLng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.toRadians(fromLat)) * Math.cos(this.toRadians(toLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRadians(value: number) { return (value * Math.PI) / 180; }
}
