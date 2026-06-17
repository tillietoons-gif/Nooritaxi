import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AirportService {
  constructor(private prisma: PrismaService) {}

  // ==========================
  // Airports & Zones
  // ==========================

  async getAirports() {
    return this.prisma.airport.findMany({
      include: { zones: true },
    });
  }

  async getAirportDetails(id: string) {
    const airport = await this.prisma.airport.findUnique({
      where: { id },
      include: {
        zones: { include: { queues: { where: { status: 'WAITING' } } } },
        flights: { take: 10, orderBy: { arrivalTime: 'asc' } },
      },
    });
    if (!airport) throw new NotFoundException('Airport not found');
    return airport;
  }

  async createAirport(data: any) {
    return this.prisma.airport.create({ data });
  }

  // ==========================
  // Queue Management
  // ==========================

  async getQueue(airportId: string) {
    return this.prisma.airportQueue.findMany({
      where: { zone: { airportId }, status: 'WAITING' },
      include: {
        driver: {
          select: {
            user: { select: { name: true, phone: true } },
            currentLat: true,
            currentLng: true,
          },
        },
        vehicle: { select: { plateNumber: true, make: true, model: true } },
        zone: { select: { name: true, type: true } },
      },
      orderBy: { entryTime: 'asc' },
    });
  }

  async assignDriver(queueId: string) {
    return this.prisma.airportQueue.update({
      where: { id: queueId },
      data: { status: 'ASSIGNED' },
    });
  }

  async removeDriverFromQueue(queueId: string) {
    return this.prisma.airportQueue.update({
      where: { id: queueId },
      data: { status: 'LEFT' },
    });
  }

  // ==========================
  // Flights
  // ==========================

  async getFlights(airportId: string) {
    return this.prisma.flight.findMany({
      where: { airportId, status: { in: ['SCHEDULED', 'ON_TIME', 'DELAYED'] } },
      orderBy: { arrivalTime: 'asc' },
    });
  }

  // ==========================
  // Analytics
  // ==========================

  async getAnalytics(airportId: string) {
    const [totalQueue, assignedToday, upcomingFlights] = await Promise.all([
      this.prisma.airportQueue.count({
        where: { zone: { airportId }, status: 'WAITING' },
      }),
      this.prisma.airportQueue.count({
        where: {
          zone: { airportId },
          status: 'ASSIGNED',
          entryTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.flight.count({
        where: {
          airportId,
          arrivalTime: {
            gte: new Date(),
            lte: new Date(Date.now() + 2 * 60 * 60 * 1000),
          }, // next 2 hours
        },
      }),
    ]);

    return {
      driversInQueue: totalQueue,
      assignedToday,
      upcomingFlightsNext2Hours: upcomingFlights,
      averageWaitTimeMins: 14, // Mocked average wait time
    };
  }
}
