import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
const clampPage = (page?: number) =>
  Math.max(Number.isFinite(page) && page ? page : 1, 1);

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

  async updateTripStatus(id: string, status: string, actorId?: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundException('Trip not found');
    const updated = await this.prisma.trip.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });
    await this.audit(
      'ADMIN_TRIP_STATUS_UPDATED',
      'Trip',
      id,
      actorId,
      { status },
      { status: trip.status },
    );
    return updated;
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

  async updateOrderStatus(id: string, status: string, actorId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: status as any },
    });
    await this.audit(
      'ADMIN_ORDER_STATUS_UPDATED',
      'Order',
      id,
      actorId,
      { status },
      { status: order.status },
    );
    return updated;
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
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              role: true,
              status: true,
            },
          },
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

  async listDriverDocuments(driverId: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { OR: [{ id: driverId }, { userId: driverId }] },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return this.prisma.driverDocument.findMany({
      where: { driverId: driver.userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDocumentStatus(
    driverId: string,
    docId: string,
    status: string,
    actorId?: string,
  ) {
    const doc = await this.prisma.driverDocument.findUnique({
      where: { id: docId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status))
      throw new BadRequestException('Invalid document status');
    const updated = await this.prisma.driverDocument.update({
      where: { id: docId },
      data: {
        status: status as any,
        verifiedBy: actorId,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
      },
    });
    await this.audit(
      'KYC_DOCUMENT_REVIEWED',
      'DriverDocument',
      docId,
      actorId,
      { status },
      { status: doc.status },
    );
    return updated;
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

  async updateUserStatus(id: string, status: string, actorId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (
      !['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DELETED'].includes(
        status,
      )
    )
      throw new BadRequestException('Invalid user status');
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: status as any },
    });
    await this.audit(
      'ADMIN_USER_STATUS_UPDATED',
      'User',
      id,
      actorId,
      { status },
      { status: user.status },
    );
    return { id: updated.id, status: updated.status };
  }

  // ------- SOS -------
  listActiveSos() {
    return this.prisma.sosAlert.findMany({
      where: { status: 'ACTIVE' as any },
      include: {
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveSos(alertId: string, actorId?: string) {
    const alert = await this.prisma.sosAlert.findUnique({
      where: { id: alertId },
    });
    if (!alert) throw new NotFoundException('SOS alert not found');
    const resolved = await this.prisma.sosAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED' as any,
        resolvedAt: new Date(),
        resolvedBy: actorId,
      },
    });
    await this.audit('SOS_RESOLVED', 'SosAlert', alertId, actorId, {
      status: 'RESOLVED',
    });
    return resolved;
  }

  // ------- Audit -------
  private async audit(
    action: string,
    entityType: string,
    entityId?: string,
    actorId?: string,
    after?: any,
    before?: any,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        actorId,
        before: before ?? undefined,
        after: after ?? undefined,
      },
    });
  }
}
