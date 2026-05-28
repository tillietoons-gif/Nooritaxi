import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Trip, TripStatus } from '@prisma/client';
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
    if (!lat || !lng) return 1;
    const activeZone = await this.prisma.surgeZone.findFirst({
      where: { isActive: true, activeFrom: { lte: new Date() }, activeUntil: { gte: new Date() } },
      orderBy: { multiplier: 'desc' },
    });
    return activeZone?.multiplier ?? 1;
  }
}
