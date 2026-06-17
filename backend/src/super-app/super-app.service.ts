import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PushService } from '../push/push.service';
import { WalletService } from '../wallet/wallet.service';

// Loyalty tier thresholds (lifetime points)
const LOYALTY_TIERS = [
  { tier: 'PLATINUM', min: 5000 },
  { tier: 'GOLD', min: 2000 },
  { tier: 'SILVER', min: 500 },
  { tier: 'BRONZE', min: 100 },
  { tier: 'NOORI', min: 0 },
] as const;

function computeTier(lifetime: number): string {
  for (const { tier, min } of LOYALTY_TIERS) {
    if (lifetime >= min) return tier;
  }
  return 'NOORI';
}

@Injectable()
export class SuperAppService {
  constructor(
    private prisma: PrismaService,
    private push: PushService,
    private wallet: WalletService,
  ) {}

  createDriverProfile(data: any) {
    return this.prisma.driver.create({
      data,
      include: { user: true, vehicles: true },
    });
  }

  listDrivers() {
    return this.prisma.driver.findMany({
      include: { user: true, vehicles: true },
      orderBy: { updatedAt: 'desc' },
    });
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
    return this.prisma.vehicle.findMany({
      where: driverId ? { driverId } : {},
      include: { driver: { include: { user: true } } },
    });
  }

  createPromotion(data: any) {
    return this.prisma.promotion.create({ data });
  }

  listPromotions(activeOnly = true) {
    return this.prisma.promotion.findMany({
      where: activeOnly
        ? {
            isActive: true,
            startsAt: { lte: new Date() },
            endsAt: { gte: new Date() },
          }
        : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async redeemPromotion(data: {
    code: string;
    userId: string;
    orderId?: string;
    tripId?: string;
    spend?: number;
  }) {
    const { code, userId, orderId, tripId, spend } = data;

    const promo = await this.prisma.promotion.findUnique({ where: { code } });
    if (!promo) throw new BadRequestException('Promotion code not found');
    if (!promo.isActive)
      throw new BadRequestException('Promotion is not active');
    const now = new Date();
    if (promo.startsAt > now)
      throw new BadRequestException('Promotion has not started yet');
    if (promo.endsAt < now)
      throw new BadRequestException('Promotion has expired');

    // Check spend minimum
    if (promo.minSpend && spend != null && spend < Number(promo.minSpend)) {
      throw new BadRequestException(
        `Minimum spend of ${promo.minSpend} required`,
      );
    }

    // Optimization: Parallelize independent usage checks to reduce latency
    const [totalUses, userUses] = await Promise.all([
      promo.usageLimit != null
        ? this.prisma.promotionRedemption.count({
            where: { promotionId: promo.id },
          })
        : Promise.resolve(0),
      this.prisma.promotionRedemption.count({
        where: { promotionId: promo.id, userId },
      }),
    ]);

    if (promo.usageLimit != null && totalUses >= promo.usageLimit) {
      throw new BadRequestException('Promotion usage limit reached');
    }

    if (userUses >= promo.perUserLimit) {
      throw new BadRequestException('You have already used this promotion');
    }

    // Compute discount
    let discount = Number(promo.value);
    if (promo.type === 'PERCENTAGE' && spend != null) {
      discount = Math.min(
        (spend * Number(promo.value)) / 100,
        promo.maxDiscount ? Number(promo.maxDiscount) : Infinity,
      );
    }

    const redemption = await this.prisma.promotionRedemption.create({
      data: { promotionId: promo.id, userId, orderId, tripId, discount },
    });

    // Credit wallet for WALLET_CREDIT type promos
    if (promo.type === 'WALLET_CREDIT') {
      await this.wallet.deposit(
        userId,
        discount,
        'CUSTOMER',
        'AFN',
        `promo:${promo.id}:${userId}`,
        {
          transactionType: 'PROMO_CREDIT',
          description: `Promo credit: ${promo.code}`,
        },
      );
    }

    return { redemption, discount };
  }

  async upsertLoyalty(userId: string, points: number) {
    const updated = await this.prisma.loyaltyAccount.upsert({
      where: { userId },
      update: {
        points: { increment: points },
        lifetime: { increment: Math.max(points, 0) },
      },
      create: { userId, points, lifetime: Math.max(points, 0) },
    });

    // Compute and persist tier from updated lifetime
    const newTier = computeTier(updated.lifetime);
    if (newTier !== updated.tier) {
      await this.prisma.loyaltyAccount.update({
        where: { userId },
        data: { tier: newTier },
      });
      return { ...updated, tier: newTier };
    }
    return updated;
  }

  async createNotification(data: any) {
    // Optimization: Parallelize notification creation and device fetching
    const [notification, devices] = await Promise.all([
      this.prisma.notification.create({ data }),
      this.prisma.pushDevice.findMany({
        where: { userId: data.userId, isActive: true },
      }),
    ]);

    const pushResult = await this.push.sendToTokens(
      devices.map((device) => device.token),
      data.title,
      data.body,
      data.data,
    );
    return { notification, push: pushResult };
  }

  listNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  registerPushDevice(data: any) {
    return this.prisma.pushDevice.upsert({
      where: { token: data.token },
      update: { ...data, isActive: true },
      create: data,
    });
  }

  createSupportTicket(data: any) {
    return this.prisma.supportTicket.create({
      data,
      include: { messages: true },
    });
  }

  listSupportTickets(status?: any, page = 1, limit = 25) {
    const safePage = Math.max(Number.isFinite(page) ? page : 1, 1);
    const safeLimit = Math.min(
      Math.max(Number.isFinite(limit) ? limit : 25, 1),
      100,
    );
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
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { cuisineTypes: { has: term } },
          ],
        },
        take: 10,
      }),
      this.prisma.menuItem.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { category: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      this.prisma.driver.findMany({
        where: { user: { name: { contains: term, mode: 'insensitive' } } },
        include: { user: true, vehicles: true },
        take: 10,
      }),
    ]).then(([restaurants, menuItems, drivers]) => ({
      restaurants,
      menuItems,
      drivers,
    }));
  }

  adminOverview() {
    const activeTripStatuses = [
      'REQUESTED',
      'ACCEPTED',
      'DRIVER_ARRIVED',
      'IN_PROGRESS',
    ] as any;
    const activeOrderStatuses = [
      'PLACED',
      'ACCEPTED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'OUT_FOR_DELIVERY',
    ] as any;
    const activeDeliveryStatuses = [
      'REQUESTED',
      'ASSIGNED',
      'PICKED_UP',
      'IN_TRANSIT',
    ] as any;

    return Promise.all([
      this.prisma.user.count(),
      this.prisma.driver.count(),
      this.prisma.trip.count(),
      this.prisma.order.count(),
      this.prisma.delivery.count(),
      this.prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'PENDING'] as any } },
      }),
      this.prisma.trip.count({ where: { status: { in: activeTripStatuses } } }),
      this.prisma.order.count({
        where: { status: { in: activeOrderStatuses } },
      }),
      this.prisma.delivery.count({
        where: { status: { in: activeDeliveryStatuses } },
      }),
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

  async audit(
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
