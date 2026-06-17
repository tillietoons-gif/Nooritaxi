import { BadRequestException } from '@nestjs/common';
import { DeliveryStatus } from '@prisma/client';

export const DeliveryStatusMachine: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.REQUESTED]: [
    DeliveryStatus.ASSIGNED,
    DeliveryStatus.CANCELLED,
  ],
  [DeliveryStatus.ASSIGNED]: [
    DeliveryStatus.PICKED_UP,
    DeliveryStatus.FAILED,
    DeliveryStatus.CANCELLED,
  ],
  [DeliveryStatus.PICKED_UP]: [
    DeliveryStatus.IN_TRANSIT,
    DeliveryStatus.FAILED,
    DeliveryStatus.CANCELLED,
  ],
  [DeliveryStatus.IN_TRANSIT]: [
    DeliveryStatus.DELIVERED,
    DeliveryStatus.FAILED,
    DeliveryStatus.CANCELLED,
  ],
  [DeliveryStatus.DELIVERED]: [],
  [DeliveryStatus.FAILED]: [],
  [DeliveryStatus.CANCELLED]: [],
};

export function assertDeliveryStatusTransition(
  from: DeliveryStatus,
  to: DeliveryStatus,
) {
  if (from === to) return;

  if (!DeliveryStatusMachine[from]?.includes(to)) {
    throw new BadRequestException(
      `Invalid delivery status transition from ${from} to ${to}`,
    );
  }
}

export function deliveryStatusTimestampData(status: DeliveryStatus) {
  if (status === DeliveryStatus.DELIVERED) {
    return { deliveredAt: new Date() };
  }

  return {};
}
