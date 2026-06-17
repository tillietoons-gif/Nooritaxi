import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

export const OrderStatusMachine: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CART]: [OrderStatus.PLACED, OrderStatus.CANCELLED],
  [OrderStatus.PLACED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [],
};

export function assertOrderStatusTransition(from: OrderStatus, to: OrderStatus) {
  if (from === to) return;

  if (!OrderStatusMachine[from]?.includes(to)) {
    throw new BadRequestException(
      `Invalid order status transition from ${from} to ${to}`,
    );
  }
}

export function orderStatusTimestampData(status: OrderStatus) {
  if (status === OrderStatus.DELIVERED) {
    return { deliveredAt: new Date() };
  }

  return {};
}