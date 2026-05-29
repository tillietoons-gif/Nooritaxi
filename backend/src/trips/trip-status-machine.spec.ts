import { TripStatus } from '@prisma/client';
import {
  assertTripStatusTransition,
  tripStatusTimestampData,
} from './trip-status-machine';

describe('TripStatusMachine', () => {
  it('allows the supported trip lifecycle transitions', () => {
    expect(() =>
      assertTripStatusTransition(TripStatus.REQUESTED, TripStatus.ACCEPTED),
    ).not.toThrow();
    expect(() =>
      assertTripStatusTransition(
        TripStatus.ACCEPTED,
        TripStatus.DRIVER_ARRIVED,
      ),
    ).not.toThrow();
    expect(() =>
      assertTripStatusTransition(
        TripStatus.DRIVER_ARRIVED,
        TripStatus.IN_PROGRESS,
      ),
    ).not.toThrow();
    expect(() =>
      assertTripStatusTransition(TripStatus.IN_PROGRESS, TripStatus.COMPLETED),
    ).not.toThrow();
    expect(() =>
      assertTripStatusTransition(TripStatus.IN_PROGRESS, TripStatus.CANCELLED),
    ).not.toThrow();
  });

  it('rejects skipped lifecycle transitions', () => {
    expect(() =>
      assertTripStatusTransition(TripStatus.REQUESTED, TripStatus.COMPLETED),
    ).toThrow('Invalid trip status transition from REQUESTED to COMPLETED');
  });

  it('sets timestamps for accepted and terminal statuses', () => {
    expect(tripStatusTimestampData(TripStatus.ACCEPTED)).toHaveProperty(
      'acceptedAt',
    );
    expect(tripStatusTimestampData(TripStatus.COMPLETED)).toHaveProperty(
      'completedAt',
    );
    expect(tripStatusTimestampData(TripStatus.CANCELLED)).toHaveProperty(
      'cancelledAt',
    );
    expect(tripStatusTimestampData(TripStatus.IN_PROGRESS)).toEqual({});
  });
});
