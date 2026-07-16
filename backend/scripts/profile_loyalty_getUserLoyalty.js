/**
 * Profiling script for LoyaltyService.getUserLoyalty
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
    findMany: async () => {
      await new Promise(resolve => setTimeout(resolve, DB_DELAY));
      return [{ id: 'tx_1', amount: 50 }, { id: 'tx_2', amount: 50 }];
    },
  },
};

async function getUserLoyaltyBaseline(userId) {
  const start = Date.now();

  // Round-trip 1: Upsert account
  const account = await mockPrisma.loyaltyAccount.upsert({
    where: { userId },
    update: {},
    create: { userId, points: 0, lifetime: 0 },
  });

  // Round-trip 2: Fetch transactions
  const recentTransactions = await mockPrisma.loyaltyTransaction.findMany({
    where: { loyaltyAccountId: account.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const duration = Date.now() - start;
  return { duration, account, recentTransactions };
}

async function run() {
  console.log('--- Profiling getUserLoyalty (Baseline) ---');
  console.log(`Simulated DB Latency: ${DB_DELAY}ms per round-trip`);

  const results = [];
  for (let i = 0; i < 5; i++) {
    const res = await getUserLoyaltyBaseline('user_123');
    results.push(res.duration);
    console.log(`Run ${i + 1}: ${res.duration}ms`);
  }

  const avg = results.reduce((a, b) => a + b, 0) / results.length;
  console.log(`Average Latency: ${avg.toFixed(2)}ms`);
  console.log('-------------------------------------------\n');
}

run().catch(console.error);
