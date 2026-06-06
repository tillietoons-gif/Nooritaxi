import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async getVehicles() {
    return this.prisma.vehicle.findMany({
      include: {
        driver: { select: { user: { select: { name: true, phone: true } } } },
        fleet: { select: { companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInspections() {
    return this.prisma.vehicleInspection.findMany({
      include: {
        vehicle: { select: { plateNumber: true, type: true, make: true } },
        inspector: { select: { name: true } },
      },
      orderBy: { inspectionDate: 'desc' },
    });
  }

  async recordInspection(data: {
    vehicleId: string;
    inspectionDate: string;
    expiryDate: string;
    status: any;
    notes: string;
    adminId: string;
  }) {
    return this.prisma.vehicleInspection.create({
      data: {
        vehicleId: data.vehicleId,
        inspectorId: data.adminId,
        inspectionDate: new Date(data.inspectionDate),
        expiryDate: new Date(data.expiryDate),
        status: data.status,
        notes: data.notes,
      },
    });
  }
}
