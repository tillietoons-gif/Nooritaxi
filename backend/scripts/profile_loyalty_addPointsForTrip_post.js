const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function addPointsForTrip_post(userId, tripId, tripFare) {
  const start = Date.now();
  const POINTS_PER_FARE_UNIT = 0.1;
  const pointsToAdd = Math.floor(tripFare * POINTS_PER_FARE_UNIT);

  if (pointsToAdd <= 0) {
    return;
  }

  // Simulated Query 1: upsert loyaltyAccount WITH transactions create nested write (single 50ms database delay)
  await delay(50);

  const duration = Date.now() - start;
  console.log(`[POST-OPTIMIZATION] addPointsForTrip latency: ${duration}ms`);
}

async function main() {
  console.log('Running post-optimization profiling for addPointsForTrip...');
  await addPointsForTrip_post('user-1', 'trip-1', 500);
}

main();
