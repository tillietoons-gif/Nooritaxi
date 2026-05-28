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

  listSupportTickets(status?: any) {
    return this.prisma.supportTicket.findMany({
      where: status ? { status } : {},
      include: { requester: true, assignee: true, messages: true },
      orderBy: { updatedAt: 'desc' },
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
    return Promise.all([
      this.prisma.user.count(),
      this.prisma.driver.count(),
      this.prisma.trip.count(),
      this.prisma.order.count(),
      this.prisma.delivery.count(),
      this.prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'PENDING'] } } }),
    ]).then(([users, drivers, rides, orders, deliveries, openTickets]) => ({
      users,
      drivers,
      rides,
      orders,
      deliveries,
      openTickets,
    }));
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
