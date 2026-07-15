const { PerformanceObserver, performance } = require('perf_hooks');

// Mock Delay Function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Prisma Service with 50ms simulated DB latency per operation
const mockPrisma = {
  loyaltyAccount: {
    upsert: async (params) => {
      await delay(50);
      const account = { id: 'account-123', userId: 'user-123', points: 100, lifetime: 500 };
      if (params.include && params.include.transactions) {
        return {
          ...account,
          transactions: [
            { id: 'tx-1', amount: 10, type: 'CREDIT', createdAt: new Date() },
            { id: 'tx-2', amount: 5, type: 'CREDIT', createdAt: new Date() }
          ]
        };
      }
      return account;
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

// Current Implementation (Optimized Merged)
async function getUserLoyaltyOptimized(userId) {
  const start = performance.now();

  const accountWithTransactions = await mockPrisma.loyaltyAccount.upsert({
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

  const { transactions, ...account } = accountWithTransactions;
  const end = performance.now();
  return {
    latency: end - start,
    data: { account, recentTransactions: transactions }
  };
}

async function runProfile() {
  console.log('--- LoyaltyService.getUserLoyalty Post-Optimization Profiling ---');

  const results = [];
  for (let i = 0; i < 5; i++) {
    const res = await getUserLoyaltyOptimized('user-123');
    results.push(res.latency);
    // Verify structure
    if (i === 0) {
      console.log('Verified return structure:', Object.keys(res.data));
      console.log('Verified account structure:', Object.keys(res.data.account));
      console.log('Verified transactions count:', res.data.recentTransactions.length);
    }
  }

  const average = results.reduce((a, b) => a + b, 0) / results.length;
  console.log(`Average Optimized Latency: ${average.toFixed(2)}ms`);
}

runProfile().catch(console.error);
