import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  // 1. Mission Control Dashboard Metrics
  async getDashboardMetrics() {
    const [activeDrivers, activeTrips, pendingTrips, sosAlerts, openIncidents] =
      await Promise.all([
        this.prisma.driver.count({
          where: { status: { in: ['ONLINE', 'BUSY'] } },
        }),
        this.prisma.trip.count({
          where: {
            status: { in: ['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'] },
          },
        }),
        this.prisma.trip.count({
          where: { status: 'REQUESTED' },
        }),
        this.prisma.sosAlert.count({
          where: { status: 'ACTIVE' },
        }),
        this.prisma.incident.count({
          where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
        }),
      ]);

    return {
      activeDrivers,
      activeTrips,
      pendingTrips,
      sosAlerts,
      openIncidents,
      activeRiders: activeTrips + pendingTrips,
      revenueToday: 450000, // Mocked for OCC view
      tripCompletionRate: 94.5, // Mocked
      cancellationRate: 5.2, // Mocked
    };
  }

  // 2. Incident Management
  async getIncidents() {
    return this.prisma.incident.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { name: true } },
        trip: {
          select: { id: true, pickupLocation: true, dropoffLocation: true },
        },
        driver: { select: { user: { select: { name: true, phone: true } } } },
        user: { select: { name: true, phone: true } },
      },
    });
  }

  async getIncidentDetails(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        trip: true,
        driver: { include: { user: true } },
        user: true,
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async createIncident(data: any) {
    return this.prisma.incident.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        tripId: data.tripId,
        driverId: data.driverId,
        userId: data.userId,
      },
    });
  }

  async updateIncident(id: string, data: any) {
    return this.prisma.incident.update({
      where: { id },
      data,
    });
  }

  // 3. SOS Management
  async getSosAlerts() {
    return this.prisma.sosAlert.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, phone: true } },
      },
    });
  }

  // 4. Dispatch Center (Manual Override)
  async manualDispatch(tripId: string, driverId: string, adminId: string) {
    const trip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        driverId,
        status: 'ACCEPTED',
      },
    });

    await this.prisma.driver.update({
      where: { id: driverId },
      data: { status: 'BUSY' },
    });

    await this.prisma.operationsAuditLog.create({
      data: {
        adminId,
        action: 'MANUAL_DISPATCH',
        targetId: tripId,
        targetType: 'TRIP',
        details: { driverId },
      },
    });

    return trip;
  }

  // 5. Communication Broadcast
  async sendBroadcast(data: {
    title: string;
    message: string;
    targetAudience: string;
    channels: string[];
    adminId: string;
  }) {
    return this.prisma.communicationBroadcast.create({
      data: {
        title: data.title,
        message: data.message,
        targetAudience: data.targetAudience,
        channels: data.channels,
        sentById: data.adminId,
      },
    });
  }

  // 6. Live Tracking Data for Map
  async getLiveMapData() {
    // Highly simplified spatial query replacement for the UI map
    // Parallelized independent Prisma queries to reduce latency
    const [drivers, activeTrips] = await Promise.all([
      this.prisma.driver.findMany({
        where: { status: { in: ['ONLINE', 'BUSY'] } },
        select: {
          id: true,
          currentLat: true,
          currentLng: true,
          status: true,
          user: { select: { name: true } },
        },
        take: 200,
      }),
      this.prisma.trip.findMany({
        where: { status: 'IN_PROGRESS' },
        select: {
          id: true,
          pickupLat: true,
          pickupLng: true,
          dropoffLat: true,
          dropoffLng: true,
        },
        take: 100,
      }),
    ]);

    return { drivers, activeTrips };
  }
}
