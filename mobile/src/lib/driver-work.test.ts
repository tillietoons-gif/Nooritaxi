/// <reference types="vitest" />

import { describe, expect, it } from 'vitest';
import { buildDriverWorkSummary, isActiveDelivery, isActiveTrip } from './driver-work';
import { Delivery, Trip } from './api';

describe('driver-work', () => {
  it('prioritizes active trips before deliveries in the combined work summary', () => {
    const trips: Trip[] = [
      {
        id: 'trip-1',
        pickupLocation: 'Airport',
        dropoffLocation: 'Wazir Akbar Khan',
        status: 'ACCEPTED',
      },
      {
        id: 'trip-2',
        pickupLocation: 'Shar-e-Naw',
        dropoffLocation: 'Kart-e-Se',
        status: 'COMPLETED',
      },
    ];
    const deliveries: Delivery[] = [
      {
        id: 'delivery-1',
        pickupAddress: 'Bakery',
        dropoffAddress: 'University',
        status: 'ASSIGNED',
      },
    ];

    const summary = buildDriverWorkSummary(trips, deliveries);

    expect(summary.activeTripCount).toBe(1);
    expect(summary.activeDeliveryCount).toBe(1);
    expect(summary.completedTripCount).toBe(1);
    expect(summary.primaryType).toBe('trip');
    expect(summary.primaryTrip?.id).toBe('trip-1');
    expect(summary.primaryDelivery?.id).toBe('delivery-1');
  });

  it('falls back to active delivery work when no trip is active', () => {
    const summary = buildDriverWorkSummary(
      [
        {
          id: 'trip-1',
          pickupLocation: 'Airport',
          dropoffLocation: 'Wazir Akbar Khan',
          status: 'COMPLETED',
        },
      ],
      [
        {
          id: 'delivery-1',
          pickupAddress: 'Bakery',
          dropoffAddress: 'University',
          status: 'PICKED_UP',
        },
      ],
    );

    expect(summary.primaryType).toBe('delivery');
    expect(summary.primaryTrip).toBeNull();
    expect(summary.primaryDelivery?.id).toBe('delivery-1');
  });

  it('filters inactive work statuses correctly', () => {
    expect(isActiveTrip({ status: 'IN_PROGRESS' })).toBe(true);
    expect(isActiveTrip({ status: 'COMPLETED' })).toBe(false);
    expect(isActiveDelivery({ status: 'IN_TRANSIT' })).toBe(true);
    expect(isActiveDelivery({ status: 'DELIVERED' })).toBe(false);
  });
});