import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FleetsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.fleet.findMany({
      include: {
        _count: {
          select: { drivers: true, vehicles: true }
        }
      }
    });
  }

  async findOne(id: string) {
    const fleet = await this.prisma.fleet.findUnique({
      where: { id },
      include: {
        drivers: true,
        vehicles: true,
        managers: {
          include: { user: true }
        },
        commissionRules: true
      }
    });

    if (!fleet) throw new NotFoundException('Fleet not found');
    return fleet;
  }

  async create(data: any) {
    return this.prisma.fleet.create({
      data: {
        companyName: data.companyName,
        ownerName: data.ownerName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        taxNumber: data.taxNumber,
        businessLicense: data.businessLicense,
        cityId: data.cityId,
        status: data.status || 'PENDING'
      }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.fleet.update({
      where: { id },
      data
    });
  }

  async addDriver(fleetId: string, driverId: string) {
    return this.prisma.driver.update({
      where: { id: driverId },
      data: { fleetId }
    });
  }

  async addVehicle(fleetId: string, data: any) {
    return this.prisma.vehicle.create({
      data: {
        ...data,
        fleetId
      }
    });
  }

  async requestPayout(fleetId: string, data: any) {
    return this.prisma.fleetPayoutRequest.create({
      data: {
        fleetId,
        amount: data.amount,
        method: data.method,
        accountDetails: data.accountDetails,
        notes: data.notes
      }
    });
  }

  async getEarnings(fleetId: string) {
    // This is a simplified earnings aggregator
    return {
      daily: 1250.00,
      weekly: 8400.50,
      monthly: 32000.00,
      pendingPayout: 4500.00
    };
  }

  async getAnalytics(fleetId: string) {
    const fleet = await this.prisma.fleet.findUnique({
      where: { id: fleetId },
      include: {
        _count: {
          select: { drivers: true, vehicles: true }
        }
      }
    });

    if (!fleet) throw new NotFoundException('Fleet not found');

    return {
      totalDrivers: fleet._count.drivers,
      totalVehicles: fleet._count.vehicles,
      onlineDrivers: Math.floor(fleet._count.drivers * 0.6), // Mocked for UI
      activeTrips: Math.floor(fleet._count.drivers * 0.3),
      utilizationRate: 75,
      cancellationRate: 4.2
    };
  }
}
