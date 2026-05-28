import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Trip, TripStatus } from '@prisma/client';
@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}
  async create(data: any): Promise<Trip> { return this.prisma.trip.create({ data }); }
  async findByUserId(userId: string): Promise<Trip[]> {
    return this.prisma.trip.findMany({ where: { OR: [{ customerId: userId }, { driverId: userId }] }, include: { customer: true, driver: true } });
  }
  async updateStatus(id: string, status: TripStatus): Promise<Trip> { return this.prisma.trip.update({ where: { id }, data: { status } }); }
}
