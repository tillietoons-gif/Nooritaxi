import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

type ListArgs = {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
};

const clampLimit = (limit?: number) =>
  Math.min(Math.max(Number.isFinite(limit) && limit ? limit : 25, 1), 100);
const clampPage = (page?: number) => Math.max(Number.isFinite(page) && page ? page : 1, 1);

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ------- Trips -------
  async listTrips({ status, q, page, from, to, limit }: ListArgs) {
    const safeLimit = clampLimit(limit);
    const safePage = clampPage(page);

    const where: Prisma.TripWhereInput = {};
    if (status) where.status = status as any;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { pickupLocation: { contains: q, mode: 'insensitive' } },
        { dropoffLocation: { contains: q, mode: 'insensitive' } },
        { customer: { is: { name: { contains: q, mode: 'insensitive' } } } },
        { customer: { is: { phone: { contains: q } } } },
        { driver: { is: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          driver: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { plateNumber: true, make: true, model: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.trip.count({ where }),
    ]);

    return { items, total, page: safePage, limit: safeLimit };
  }

  getTrip(id: string) {
    return this.prisma.trip.findUnique({
      where: { id },
      include: {
        customer: true,
        driver: true,
        vehicle: true,
        reviews: true,
        transactions: true,
      },
    });
  }

  // ------- Orders -------
  async listOrders({ status, q, page, from, to, limit }: ListArgs) {
    const safeLimit = clampLimit(limit);
    const safePage = clampPage(page);

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status as any;
    if (from || to) {
      where.placedAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { deliveryAddress: { contains: q, mode: 'insensitive' } },
        { restaurant: { is: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          restaurant: { select: { id: true, name: true } },
          items: { include: { menuItem: { select: { name: true } } } },
          delivery: { select: { id: true, status: true, driverId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page: safePage, limit: safeLimit };
  }

  // ------- Deliveries -------
  async listDeliveries({ status, q, page, from, to, limit }: ListArgs) {
    const safeLimit = clampLimit(limit);
    const safePage = clampPage(page);

    const where: Prisma.DeliveryWhereInput = {};
    if (status) where.status = status as any;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { pickupAddress: { contains: q, mode: 'insensitive' } },
        { dropoffAddress: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        include: {
          driver: { select: { id: true, name: true } },
          sender: { select: { id: true, name: true } },
          order: { select: { id: true, restaurantId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.delivery.count({ where }),
    ]);
    return { items, total, page: safePage, limit: safeLimit };
  }

  // ------- Drivers -------
  async listDrivers({ status, q, page, limit }: ListArgs) {
    const safeLimit = clampLimit(limit);
    const safePage = clampPage(page);

    const where: Prisma.DriverWhereInput = {};
    if (status) where.status = status as any;
    if (q) {
      where.OR = [
        { user: { is: { name: { contains: q, mode: 'insensitive' } } } },
        { user: { is: { phone: { contains: q } } } },
        { licenseNumber: { contains: q, mode: 'insensitive' } },
        { nationalIdNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.driver.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, phone: true, role: true, status: true } },
          vehicles: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.driver.count({ where }),
    ]);
    return { items, total, page: safePage, limit: safeLimit };
  }

  // ------- Users -------
  async listUsers({ status, q, page, limit }: ListArgs & { role?: string }) {
    const safeLimit = clampLimit(limit);
    const safePage = clampPage(page);

    const where: Prisma.UserWhereInput = {};
    if (status) where.status = status as any;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page: safePage, limit: safeLimit };
  }
}
