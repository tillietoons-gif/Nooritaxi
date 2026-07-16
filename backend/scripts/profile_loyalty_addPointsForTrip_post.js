/**
 * Post-optimization profiling script for LoyaltyService.addPointsForTrip
 */

const DB_DELAY = 50; // ms

const mockPrisma = {
  loyaltyAccount: {
    upsert: async () => {
      await new Promise(resolve => setTimeout(resolve, DB_DELAY));
      return { id: 'acc_123', userId: 'user_123', points: 110, lifetime: 510, tier: 'SILVER' };
    },
  },
};

async function addPointsForTripOptimized(userId, tripId, tripFare) {
  const pointsToAdd = Math.floor(tripFare * 0.1);
  if (pointsToAdd <= 0) return;

  const start = Date.now();

  // Single round-trip: Upsert with nested write
  await mockPrisma.loyaltyAccount.upsert({
    where: { userId },
    update: {
      points: { increment: pointsToAdd },
      lifetime: { increment: pointsToAdd },
      transactions: {
        create: {
          tripId: tripId,
          type: 'CREDIT',
          amount: pointsToAdd,
          description: `Points earned from trip #${tripId.substring(0, 8)}`,
        },
      },
    },
    create: {
      userId,
      points: pointsToAdd,
      lifetime: pointsToAdd,
      transactions: {
        create: {
          tripId: tripId,
          type: 'CREDIT',
          amount: pointsToAdd,
          description: `Points earned from trip #${tripId.substring(0, 8)}`,
        },
      },
    },
  });

  const duration = Date.now() - start;
  return { duration };
}

async function run() {
  console.log('--- Profiling addPointsForTrip (Optimized) ---');
  console.log(`Simulated DB Latency: ${DB_DELAY}ms per round-trip`);

  const results = [];
  for (let i = 0; i < 5; i++) {
    const res = await addPointsForTripOptimized('user_123', 'trip_45678901', 100);
    results.push(res.duration);
    console.log(`Run ${i + 1}: ${res.duration}ms`);
  }

  const avg = results.reduce((a, b) => a + b, 0) / results.length;
  console.log(`Average Latency: ${avg.toFixed(2)}ms`);
  console.log('--------------------------------------------\n');
}

run().catch(console.error);
