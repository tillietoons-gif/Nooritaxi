/**
 * Post-optimization profiling script for LoyaltyService.getUserLoyalty
 */

const DB_DELAY = 50; // ms

const mockPrisma = {
  loyaltyAccount: {
    upsert: async (params) => {
      await new Promise(resolve => setTimeout(resolve, DB_DELAY));
      const account = { id: 'acc_123', userId: params.where.userId, points: 100, lifetime: 500, tier: 'SILVER' };
      if (params.include?.transactions) {
        account.transactions = [{ id: 'tx_1', amount: 50 }, { id: 'tx_2', amount: 50 }];
      }
      return account;
    },
  },
};

async function getUserLoyaltyOptimized(userId) {
  const start = Date.now();

  // Single round-trip: Upsert with include
  const account = await mockPrisma.loyaltyAccount.upsert({
    where: { userId },
    update: {},
    create: { userId, points: 0, lifetime: 0 },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  const { transactions: recentTransactions, ...accountData } = account;
  const duration = Date.now() - start;
  return { duration, account: accountData, recentTransactions };
}

async function run() {
  console.log('--- Profiling getUserLoyalty (Optimized) ---');
  console.log(`Simulated DB Latency: ${DB_DELAY}ms per round-trip`);

  const results = [];
  for (let i = 0; i < 5; i++) {
    const res = await getUserLoyaltyOptimized('user_123');
    results.push(res.duration);
    console.log(`Run ${i + 1}: ${res.duration}ms`);
  }

  const avg = results.reduce((a, b) => a + b, 0) / results.length;
  console.log(`Average Latency: ${avg.toFixed(2)}ms`);
  console.log('--------------------------------------------\n');
}

run().catch(console.error);
