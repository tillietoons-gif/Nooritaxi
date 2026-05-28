import { BadRequestException, Injectable } from '@nestjs/common';
import { Order, PaymentMethod, Trip } from '@prisma/client';
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

  async createRide(data: any) {
    const distance = data.distance ?? 5;
    const surgeMultiplier = data.surgeMultiplier ?? 1;
    const { baseFare, fare } = this.estimateRideFare(distance, surgeMultiplier);
    const ride = await this.prisma.trip.create({
      data: {
        ...data,
        distance,
        baseFare,
        fare,
        surgeMultiplier,
        safetyCode: data.safetyCode ?? Math.floor(1000 + Math.random() * 9000).toString(),
      },
    });
    await this.audit('RIDE_CREATED', 'Trip', ride.id, data.customerId, ride);
    return ride;
  }

  getRideEstimate(distance = 5, surgeMultiplier = 1) {
    return this.estimateRideFare(distance, surgeMultiplier);
  }

  listRides(userId?: string, page = 1, limit = 25) {
    return this.prisma.trip.findMany({
      where: userId ? { OR: [{ customerId: userId }, { driverId: userId }] } : {},
      include: { customer: true, driver: true, vehicle: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRide(id: string, data: any) {
    const { ride, before } = await this.prisma.$transaction(async (tx) => {
      const before = await tx.trip.findUnique({ where: { id } });
      const ride = await tx.trip.update({ where: { id }, data });

      if (before && before.status !== 'COMPLETED' && ride.status === 'COMPLETED') {
        await this.settleCompletedRide(ride, tx);
      }

      return { ride, before };
    });

    await this.audit('RIDE_UPDATED', 'Trip', id, data.actorId, ride, before);
    return ride;
  }

  createRestaurant(data: any) {
    return this.prisma.restaurant.create({ data });
  }

  listRestaurants(query?: string, page = 1, limit = 25) {
    return this.prisma.restaurant.findMany({
      where: query
        ? { OR: [{ name: { contains: query, mode: 'insensitive' } }, { cuisineTypes: { has: query } }] }
        : {},
      include: { menuItems: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ status: 'asc' }, { ratingAverage: 'desc' }],
    });
  }

  addMenuItem(restaurantId: string, data: any) {
    return this.prisma.menuItem.create({ data: { ...data, restaurantId } });
  }

  async createOrder(data: any) {
    const menuItems = data.items?.length
      ? await this.prisma.menuItem.findMany({ where: { id: { in: data.items.map((item: any) => item.menuItemId) } } })
      : [];
    const subtotal = data.items?.reduce((sum: number, item: any) => {
      const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);
      return sum + Number(item.unitPrice ?? menuItem?.price ?? 0) * (item.quantity ?? 1);
    }, 0) ?? Number(data.subtotal ?? 0);
    const deliveryFee = Number(data.deliveryFee ?? (subtotal > 1500 ? 0 : 80));
    const discount = Number(data.discount ?? 0);
    const total = Math.max(subtotal + deliveryFee - discount, 0);

    return this.prisma.order.create({
      data: {
        riderId: data.riderId,
        restaurantId: data.restaurantId,
        deliveryAddress: data.deliveryAddress,
        deliveryLat: data.deliveryLat,
        deliveryLng: data.deliveryLng,
        notes: data.notes,
        subtotal,
        deliveryFee,
        discount,
        total,
        paymentMethod: data.paymentMethod ?? 'CASH',
        items: data.items?.length
          ? {
              create: data.items.map((item: any) => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity ?? 1,
                unitPrice: item.unitPrice ?? menuItems.find((entry) => entry.id === item.menuItemId)?.price ?? 0,
                notes: item.notes,
              })),
            }
          : undefined,
      },
      include: { items: true, restaurant: true },
    }).then(async (order) => {
      await this.audit('ORDER_CREATED', 'Order', order.id, data.riderId, order);
      return order;
    });
  }

  listOrders(userId?: string, restaurantId?: string, page = 1, limit = 25) {
    return this.prisma.order.findMany({
      where: { ...(userId ? { riderId: userId } : {}), ...(restaurantId ? { restaurantId } : {}) },
      include: { items: { include: { menuItem: true } }, restaurant: true, delivery: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrder(id: string, data: any) {
    const { order, before } = await this.prisma.$transaction(async (tx) => {
      const before = await tx.order.findUnique({ where: { id } });
      const order = await tx.order.update({
        where: { id },
        data,
        include: { delivery: true, items: true, restaurant: true },
      });

      if (before && before.status !== 'DELIVERED' && order.status === 'DELIVERED') {
        await this.settleDeliveredOrder(order, tx);
      }

      return { order, before };
    });

    await this.audit('ORDER_UPDATED', 'Order', id, data.actorId, order, before);
    return order;
  }

  async createDelivery(data: any) {
    const driver = data.driverId
      ? null
      : await this.prisma.driver.findFirst({ where: { status: 'ONLINE' }, include: { vehicles: { where: { isActive: true }, take: 1 } }, orderBy: { ratingAverage: 'desc' } });
    const delivery = await this.prisma.delivery.create({
      data: {
        ...data,
        driverId: data.driverId ?? driver?.userId,
        vehicleId: data.vehicleId ?? driver?.vehicles[0]?.id,
        fee: data.fee ?? 100,
        status: data.driverId || driver ? 'ASSIGNED' : 'REQUESTED',
      },
      include: { order: true, driver: true, vehicle: true },
    });
    await this.audit('DELIVERY_CREATED', 'Delivery', delivery.id, data.senderId, delivery);
    return delivery;
  }

  listDeliveries(userId?: string, page = 1, limit = 25) {
    return this.prisma.delivery.findMany({
      where: userId ? { OR: [{ senderId: userId }, { driverId: userId }] } : {},
      include: { order: true, sender: true, driver: true, vehicle: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDelivery(id: string, data: any) {
    const before = await this.prisma.delivery.findUnique({ where: { id } });
    const delivery = await this.prisma.delivery.update({ where: { id }, data });
    await this.audit('DELIVERY_UPDATED', 'Delivery', id, data.actorId, delivery, before);
    return delivery;
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

  createReview(data: any) {
    return this.prisma.review.create({ data });
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

  private async settleCompletedRide(ride: Trip, tx: any) {
    if (ride.paymentMethod !== PaymentMethod.WALLET) return;
    if (!ride.driverId) throw new BadRequestException('Cannot settle wallet ride without an assigned driver');

    const amount = Number(ride.fare ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Cannot settle wallet ride without a positive fare');
    }

    await this.wallet.transfer(
      ride.customerId,
      amount,
      `Ride payment for ${ride.id}`,
      `ride:${ride.id}:wallet-payment`,
      {
        tx,
        transactionType: 'RIDE_PAYMENT',
        tripId: ride.id,
      },
    );

    await this.wallet.deposit(
      ride.driverId,
      amount,
      'DRIVER',
      'AFN',
      `ride:${ride.id}:driver-payout`,
      {
        tx,
        transactionType: 'DRIVER_PAYOUT',
        description: `Driver payout for ride ${ride.id}`,
        tripId: ride.id,
      },
    );
  }

  private async settleDeliveredOrder(order: Order & { restaurant: { ownerId: string } }, tx: any) {
    if (order.paymentMethod !== PaymentMethod.WALLET) return;

    const amount = Number(order.total ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Cannot settle wallet order without a positive total');
    }

    await this.wallet.transfer(
      order.riderId,
      amount,
      `Order payment for ${order.id}`,
      `order:${order.id}:wallet-payment`,
      {
        tx,
        transactionType: 'ORDER_PAYMENT',
        orderId: order.id,
      },
    );

    await this.wallet.deposit(
      order.restaurant.ownerId,
      amount,
      'MERCHANT',
      'AFN',
      `order:${order.id}:merchant-payout`,
      {
        tx,
        transactionType: 'MERCHANT_PAYOUT',
        description: `Merchant payout for order ${order.id}`,
        orderId: order.id,
      },
    );
  }

  private estimateRideFare(distance = 5, surgeMultiplier = 1) {
    const safeDistance = Number.isFinite(Number(distance)) ? Number(distance) : 5;
    const safeSurge = Number.isFinite(Number(surgeMultiplier)) ? Number(surgeMultiplier) : 1;
    const baseFare = 80;
    const perKm = 35;
    const fare = Math.round((baseFare + safeDistance * perKm) * safeSurge);
    return { baseFare, perKm, distance: safeDistance, surgeMultiplier: safeSurge, fare, currency: 'AFN' };
  }
}
