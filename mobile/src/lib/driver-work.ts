import { Delivery, Trip } from './api';

export function isActiveTrip(trip: Pick<Trip, 'status'>) {
  return !['COMPLETED', 'CANCELLED'].includes(trip.status);
}

export function isActiveDelivery(delivery: Pick<Delivery, 'status'>) {
  return !['DELIVERED', 'FAILED', 'CANCELLED'].includes(delivery.status);
}

export function buildDriverWorkSummary(trips: Trip[], deliveries: Delivery[]) {
  const activeTrips = trips.filter(isActiveTrip);
  const activeDeliveries = deliveries.filter(isActiveDelivery);
  const completedTrips = trips.filter((trip) => trip.status === 'COMPLETED').length;
  const primaryTrip = activeTrips[0] ?? null;
  const primaryDelivery = activeDeliveries[0] ?? null;

  return {
    activeTrips,
    activeDeliveries,
    activeTripCount: activeTrips.length,
    activeDeliveryCount: activeDeliveries.length,
    completedTripCount: completedTrips,
    primaryTrip,
    primaryDelivery,
    primaryType: primaryTrip ? 'trip' : primaryDelivery ? 'delivery' : null,
  };
}