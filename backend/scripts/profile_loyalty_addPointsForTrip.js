/**
 * Profiling script for LoyaltyService.addPointsForTrip
 * Simulates database latency to measure the impact of sequential vs parallel round-trips.
 */

const DB_DELAY = 50; // ms

const mockPrisma = {
  loyaltyAccount: {
    upsert: async () => {
      await new Promise(resolve => setTimeout(resolve, DB_DELAY));
      return { id: 'acc_123', userId: 'user_123', points: 100, lifetime: 500, tier: 'SILVER' };
    },
  },
  loyaltyTransaction: {
    create: async () => {
      await new Promise(resolve => setTimeout(resolve, DB_DELAY));
      return { id: 'tx_new', amount: 10 };
    },
  },
  $transaction: async (fn) => {
    // Interactive transactions often have a small overhead, but here we just execute the function
    return fn(mockPrisma);
  }
};

async function addPointsForTripBaseline(userId, tripId, tripFare) {
  const pointsToAdd = Math.floor(tripFare * 0.1);
  if (pointsToAdd <= 0) return;

  const start = Date.now();

  await mockPrisma.$transaction(async (tx) => {
    // Round-trip 1: Upsert account
    const loyaltyAccount = await tx.loyaltyAccount.upsert({
      where: { userId },
      update: { points: { increment: pointsToAdd }, lifetime: { increment: pointsToAdd } },
      create: { userId, points: pointsToAdd, lifetime: pointsToAdd },
    });

    // Round-trip 2: Create transaction
    await tx.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: loyaltyAccount.id,
        tripId: tripId,
        type: 'CREDIT',
        amount: pointsToAdd,
        description: `Points earned from trip #${tripId.substring(0, 8)}`,
      },
    });
  });

  const duration = Date.now() - start;
  return { duration };
}

async function run() {
  console.log('--- Profiling addPointsForTrip (Baseline) ---');
  console.log(`Simulated DB Latency: ${DB_DELAY}ms per round-trip`);

  const results = [];
  for (let i = 0; i < 5; i++) {
    const res = await addPointsForTripBaseline('user_123', 'trip_45678901', 100);
    results.push(res.duration);
    console.log(`Run ${i + 1}: ${res.duration}ms`);
  }

  const avg = results.reduce((a, b) => a + b, 0) / results.length;
  console.log(`Average Latency: ${avg.toFixed(2)}ms`);
  console.log('--------------------------------------------\n');
}

run().catch(console.error);
