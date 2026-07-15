const { PerformanceObserver, performance } = require('perf_hooks');

// Mock Delay Function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Prisma Service with 50ms simulated DB latency per operation
const mockPrisma = {
  loyaltyAccount: {
    upsert: async () => {
      await delay(50);
      return { id: 'account-123', userId: 'user-123', points: 100, lifetime: 500 };
    }
  },
  loyaltyTransaction: {
    findMany: async () => {
      await delay(50);
      return [
        { id: 'tx-1', amount: 10, type: 'CREDIT', createdAt: new Date() },
        { id: 'tx-2', amount: 5, type: 'CREDIT', createdAt: new Date() }
      ];
    }
  }
};

// Current Implementation (Sequential)
async function getUserLoyaltySequential(userId) {
  const start = performance.now();

  const account = await mockPrisma.loyaltyAccount.upsert({
    where: { userId },
    update: {},
    create: { userId, points: 0, lifetime: 0 },
  });

  const recentTransactions = await mockPrisma.loyaltyTransaction.findMany({
    where: { loyaltyAccountId: account.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const end = performance.now();
  return {
    latency: end - start,
    data: { account, recentTransactions }
  };
}

// Optimization (Parallel/Merged) - for later comparison
async function getUserLoyaltyOptimized(userId) {
  const start = performance.now();

  // Mocking the merged query (one 50ms delay)
  await delay(50);
  const result = {
    id: 'account-123',
    userId: 'user-123',
    points: 100,
    lifetime: 500,
    transactions: [
      { id: 'tx-1', amount: 10, type: 'CREDIT', createdAt: new Date() },
      { id: 'tx-2', amount: 5, type: 'CREDIT', createdAt: new Date() }
    ]
  };

  const { transactions, ...account } = result;

  const end = performance.now();
  return {
    latency: end - start,
    data: { account, recentTransactions: transactions }
  };
}

async function runProfile() {
  console.log('--- LoyaltyService.getUserLoyalty Baseline Profiling ---');

  const sequentialResults = [];
  for (let i = 0; i < 5; i++) {
    const res = await getUserLoyaltySequential('user-123');
    sequentialResults.push(res.latency);
  }

  const avgSequential = sequentialResults.reduce((a, b) => a + b, 0) / sequentialResults.length;
  console.log(`Average Sequential Latency: ${avgSequential.toFixed(2)}ms`);

  console.log('\n--- Simulation of Optimized Implementation ---');
  const optimizedResults = [];
  for (let i = 0; i < 5; i++) {
    const res = await getUserLoyaltyOptimized('user-123');
    optimizedResults.push(res.latency);
  }

  const avgOptimized = optimizedResults.reduce((a, b) => a + b, 0) / optimizedResults.length;
  console.log(`Average Optimized Latency: ${avgOptimized.toFixed(2)}ms`);
  console.log(`Expected Latency Reduction: ${(((avgSequential - avgOptimized) / avgSequential) * 100).toFixed(2)}%`);
}

runProfile().catch(console.error);
