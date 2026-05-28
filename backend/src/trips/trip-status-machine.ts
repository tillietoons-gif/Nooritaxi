import { BadRequestException } from '@nestjs/common';
import { TripStatus } from '@prisma/client';

export const TripStatusMachine: Record<TripStatus, TripStatus[]> = {
  [TripStatus.REQUESTED]: [TripStatus.ACCEPTED],
  [TripStatus.ACCEPTED]: [TripStatus.DRIVER_ARRIVED],
  [TripStatus.DRIVER_ARRIVED]: [TripStatus.IN_PROGRESS],
  [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
  [TripStatus.COMPLETED]: [],
  [TripStatus.CANCELLED]: [],
};

export function assertTripStatusTransition(from: TripStatus, to: TripStatus) {
  if (from === to) return;

  if (!TripStatusMachine[from]?.includes(to)) {
    throw new BadRequestException(`Invalid trip status transition from ${from} to ${to}`);
  }
}

export function tripStatusTimestampData(status: TripStatus) {
  const now = new Date();

  if (status === TripStatus.ACCEPTED) return { acceptedAt: now };
  if (status === TripStatus.COMPLETED) return { completedAt: now };
  if (status === TripStatus.CANCELLED) return { cancelledAt: now };

  return {};
}
