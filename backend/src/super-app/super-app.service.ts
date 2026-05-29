import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PushService } from '../push/push.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class SuperAppService {
  constructor(
    private prisma: PrismaService,
    private push: PushService,
    private wallet: WalletService,
  ) {}

  createDriverProfile(data: any) {
    return this.prisma.driver.create({ data, include: { user: true, vehicles: true } });
  }

  listDrivers() {
    return this.prisma.driver.findMany({ include: { user: true, vehicles: true }, orderBy: { updatedAt: 'desc' } });
  }

  upsertRiderProfile(userId: string, data: any) {
    return this.prisma.rider.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  addVehicle(data: any) {
    return this.prisma.vehicle.create({ data });
  }

  listVehicles(driverId?: string) {
    return this.prisma.vehicle.findMany({ where: driverId ? { driverId } : {}, include: { driver: { include: { user: true } } } });
  }

  createPromotion(data: any) {
    return this.prisma.promotion.create({ data });
  }

  listPromotions(activeOnly = true) {
    return this.prisma.promotion.findMany({
      where: activeOnly ? { isActive: true, startsAt: { lte: new Date() }, endsAt: { gte: new Date() } } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  redeemPromotion(data: any) {
    return this.prisma.promotionRedemption.create({ data });
  }

  upsertLoyalty(userId: string, points: number) {
    return this.prisma.loyaltyAccount.upsert({
      where: { userId },
      update: { points: { increment: points }, lifetime: { increment: Math.max(points, 0) } },
      create: { userId, points, lifetime: Math.max(points, 0) },
    });
  }

  async createNotification(data: any) {
    const notification = await this.prisma.notification.create({ data });
    const devices = await this.prisma.pushDevice.findMany({ where: { userId: data.userId, isActive: true } });
    const pushResult = await this.push.sendToTokens(
      devices.map((device) => device.token),
      data.title,
      data.body,
      data.data,
    );
    return { notification, push: pushResult };
  }

  listNotifications(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  registerPushDevice(data: any) {
    return this.prisma.pushDevice.upsert({
      where: { token: data.token },
      update: { ...data, isActive: true },
      create: data,
    });
  }

  createSupportTicket(data: any) {
    return this.prisma.supportTicket.create({ data, include: { messages: true } });
  }

  listSupportTickets(status?: any, page = 1, limit = 25) {
    const safePage = Math.max(Number.isFinite(page) ? page : 1, 1);
    const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 25, 1), 100);
    return this.prisma.supportTicket.findMany({
      where: status ? { status } : {},
      include: { requester: true, assignee: true, messages: true },
      orderBy: { updatedAt: 'desc' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
  }

  addSupportMessage(ticketId: string, data: any) {
    return this.prisma.supportMessage.create({ data: { ...data, ticketId } });
  }

  smartSearch(query: string) {
    const term = query ?? '';
    return Promise.all([
      this.prisma.restaurant.findMany({
        where: { OR: [{ name: { contains: term, mode: 'insensitive' } }, { cuisineTypes: { has: term } }] },
        take: 10,
      }),
      this.prisma.menuItem.findMany({
        where: { OR: [{ name: { contains: term, mode: 'insensitive' } }, { category: { contains: term, mode: 'insensitive' } }] },
        take: 10,
      }),
      this.prisma.driver.findMany({
        where: { user: { name: { contains: term, mode: 'insensitive' } } },
        include: { user: true, vehicles: true },
        take: 10,
      }),
    ]).then(([restaurants, menuItems, drivers]) => ({ restaurants, menuItems, drivers }));
  }

  adminOverview() {
    const activeTripStatuses = ['REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'] as any;
    const activeOrderStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'] as any;
    const activeDeliveryStatuses = ['REQUESTED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] as any;

    return Promise.all([
      this.prisma.user.count(),
      this.prisma.driver.count(),
      this.prisma.trip.count(),
      this.prisma.order.count(),
      this.prisma.delivery.count(),
      this.prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'PENDING'] as any } } }),
      this.prisma.trip.count({ where: { status: { in: activeTripStatuses } } }),
      this.prisma.order.count({ where: { status: { in: activeOrderStatuses } } }),
      this.prisma.delivery.count({ where: { status: { in: activeDeliveryStatuses } } }),
    ]).then(
      ([
        users,
        drivers,
        rides,
        orders,
        deliveries,
        openTickets,
        activeRides,
        activeOrders,
        activeDeliveries,
      ]) => ({
        users,
        drivers,
        rides,
        orders,
        deliveries,
        openTickets,
        activeRides,
        activeOrders,
        activeDeliveries,
      }),
    );
  }

  private async audit(action: string, entityType: string, entityId?: string, actorId?: string, after?: any, before?: any) {
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
