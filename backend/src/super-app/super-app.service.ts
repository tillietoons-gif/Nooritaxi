import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SuperAppService {
  constructor(private prisma: PrismaService) {}

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

  createRide(data: any) {
    return this.prisma.trip.create({ data });
  }

  listRides(userId?: string) {
    return this.prisma.trip.findMany({
      where: userId ? { OR: [{ customerId: userId }, { driverId: userId }] } : {},
      include: { customer: true, driver: true, vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateRide(id: string, data: any) {
    return this.prisma.trip.update({ where: { id }, data });
  }

  createRestaurant(data: any) {
    return this.prisma.restaurant.create({ data });
  }

  listRestaurants(query?: string) {
    return this.prisma.restaurant.findMany({
      where: query
        ? { OR: [{ name: { contains: query, mode: 'insensitive' } }, { cuisineTypes: { has: query } }] }
        : {},
      include: { menuItems: true },
      orderBy: [{ status: 'asc' }, { ratingAverage: 'desc' }],
    });
  }

  addMenuItem(restaurantId: string, data: any) {
    return this.prisma.menuItem.create({ data: { ...data, restaurantId } });
  }

  createOrder(data: any) {
    return this.prisma.order.create({
      data: {
        riderId: data.riderId,
        restaurantId: data.restaurantId,
        deliveryAddress: data.deliveryAddress,
        deliveryLat: data.deliveryLat,
        deliveryLng: data.deliveryLng,
        notes: data.notes,
        subtotal: data.subtotal ?? 0,
        deliveryFee: data.deliveryFee ?? 0,
        discount: data.discount ?? 0,
        total: data.total ?? 0,
        paymentMethod: data.paymentMethod ?? 'CASH',
        items: data.items?.length
          ? {
              create: data.items.map((item: any) => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity ?? 1,
                unitPrice: item.unitPrice,
                notes: item.notes,
              })),
            }
          : undefined,
      },
      include: { items: true, restaurant: true },
    });
  }

  listOrders(userId?: string, restaurantId?: string) {
    return this.prisma.order.findMany({
      where: { ...(userId ? { riderId: userId } : {}), ...(restaurantId ? { restaurantId } : {}) },
      include: { items: { include: { menuItem: true } }, restaurant: true, delivery: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateOrder(id: string, data: any) {
    return this.prisma.order.update({ where: { id }, data, include: { delivery: true, items: true } });
  }

  createDelivery(data: any) {
    return this.prisma.delivery.create({ data, include: { order: true, driver: true, vehicle: true } });
  }

  listDeliveries(userId?: string) {
    return this.prisma.delivery.findMany({
      where: userId ? { OR: [{ senderId: userId }, { driverId: userId }] } : {},
      include: { order: true, sender: true, driver: true, vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateDelivery(id: string, data: any) {
    return this.prisma.delivery.update({ where: { id }, data });
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

  createNotification(data: any) {
    return this.prisma.notification.create({ data });
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
}
