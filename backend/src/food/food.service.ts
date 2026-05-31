import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Order, PaymentMethod } from '@prisma/client';
import { WalletService } from '../wallet/wallet.service';
import { DispatchService } from '../dispatch/dispatch.service';

@Injectable()
export class FoodService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
    private dispatch: DispatchService,
  ) {}

  createRestaurant(data: any) {
    return this.prisma.restaurant.create({ data });
  }

  listRestaurants(query?: string, page = 1, limit = 25) {
    return this.prisma.restaurant.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { cuisineTypes: { has: query } },
            ],
          }
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

  getRestaurantMenu(restaurantId: string) {
    return this.prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async createOrder(data: any) {
    const menuItems = data.items?.length
      ? await this.prisma.menuItem.findMany({
          where: { id: { in: data.items.map((item: any) => item.menuItemId) } },
        })
      : [];
    const subtotal =
      data.items?.reduce((sum: number, item: any) => {
        const menuItem = menuItems.find(
          (entry) => entry.id === item.menuItemId,
        );
        return (
          sum +
          Number(item.unitPrice ?? menuItem?.price ?? 0) * (item.quantity ?? 1)
        );
      }, 0) ?? Number(data.subtotal ?? 0);
    const deliveryFee = Number(data.deliveryFee ?? (subtotal > 1500 ? 0 : 80));
    const discount = Number(data.discount ?? 0);
    const total = Math.max(subtotal + deliveryFee - discount, 0);

    return this.prisma.order
      .create({
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
                  unitPrice:
                    item.unitPrice ??
                    menuItems.find((entry) => entry.id === item.menuItemId)
                      ?.price ??
                    0,
                  notes: item.notes,
                })),
              }
            : undefined,
        },
        include: { items: true, restaurant: true },
      })
      .then(async (order) => {
        await this.audit(
          'ORDER_CREATED',
          'Order',
          order.id,
          data.riderId,
          order,
        );
        return order;
      });
  }

  listOrders(userId?: string, restaurantId?: string, page = 1, limit = 25) {
    return this.prisma.order.findMany({
      where: {
        ...(userId ? { riderId: userId } : {}),
        ...(restaurantId ? { restaurantId } : {}),
      },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        delivery: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrder(id: string, data: any) {
    const { order, before } = await this.prisma.$transaction(async (tx) => {
      const before = await tx.order.findUnique({
        where: { id },
        include: { restaurant: true },
      });
      const order = await tx.order.update({
        where: { id },
        data,
        include: { delivery: true, items: true, restaurant: true },
      });

      if (
        before &&
        before.status !== 'DELIVERED' &&
        order.status === 'DELIVERED'
      ) {
        await this.settleDeliveredOrder(order, tx);
      }

      // Feature: Auto dispatch driver when order is ready
      if (
        before &&
        before.status !== 'READY_FOR_PICKUP' &&
        order.status === 'READY_FOR_PICKUP' &&
        !order.delivery
      ) {
        const driver = await this.dispatch.findNearestOnlineDriver(
          order.restaurant.lat ?? 0,
          order.restaurant.lng ?? 0,
          10,
          tx,
        );

        // Auto-create delivery
        await tx.delivery.create({
          data: {
            orderId: order.id,
            pickupAddress: order.restaurant.address,
            pickupLat: order.restaurant.lat,
            pickupLng: order.restaurant.lng,
            dropoffAddress: order.deliveryAddress,
            dropoffLat: order.deliveryLat,
            dropoffLng: order.deliveryLng,
            fee: order.deliveryFee,
            status: driver ? 'ASSIGNED' : 'REQUESTED',
            driverId: driver?.userId,
            vehicleId: driver?.vehicles[0]?.id,
          },
        });
      }

      return { order, before };
    });

    await this.audit('ORDER_UPDATED', 'Order', id, data.actorId, order, before);
    return order;
  }

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

  private async settleDeliveredOrder(
    order: Order & { restaurant: { ownerId: string } },
    tx: any,
  ) {
    if (order.paymentMethod !== PaymentMethod.WALLET) return;

    const amount = Number(order.total ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException(
        'Cannot settle wallet order without a positive total',
      );
    }

    await this.wallet.transfer(
      order.riderId,
      amount,
      `Order payment for ${order.id}`,
      `order:${order.id}:wallet-payment`,
      { tx, transactionType: 'ORDER_PAYMENT', orderId: order.id },
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
}
