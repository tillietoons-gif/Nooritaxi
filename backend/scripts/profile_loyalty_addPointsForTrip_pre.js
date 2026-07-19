const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function addPointsForTrip_pre(userId, tripId, tripFare) {
  const start = Date.now();
  const POINTS_PER_FARE_UNIT = 0.1;
  const pointsToAdd = Math.floor(tripFare * POINTS_PER_FARE_UNIT);

  if (pointsToAdd <= 0) {
    return;
  }

  // Simulated Query 1: upsert loyaltyAccount (50ms database delay)
  await delay(50);
  const loyaltyAccount = { id: 'acc-1', userId, points: pointsToAdd, lifetime: pointsToAdd };

  // Simulated Query 2: create loyaltyTransaction (50ms database delay)
  await delay(50);

  const duration = Date.now() - start;
  console.log(`[PRE-OPTIMIZATION] addPointsForTrip latency: ${duration}ms`);
}

async function main() {
  console.log('Running pre-optimization profiling for addPointsForTrip...');
  await addPointsForTrip_pre('user-1', 'trip-1', 500);
}

main();
