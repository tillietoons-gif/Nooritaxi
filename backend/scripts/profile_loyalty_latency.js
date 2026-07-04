async function profile() {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Mock Prisma Service with 50ms artificial delay per call
  const mockPrisma = {
    loyaltyAccount: {
      upsert: async (args) => {
        await delay(50);
        const result = { id: 'account_123', userId: 'user_123', points: 0, lifetime: 0 };
        // If include is present, it means the optimization is applied
        if (args.include && args.include.transactions) {
           result.transactions = [];
        }
        return result;
      },
    },
    loyaltyTransaction: {
      findMany: async () => {
        await delay(50);
        return [];
      },
    },
  };

  // Logic from LoyaltyService.getUserLoyalty (Baseline)
  async function getUserLoyaltyBaseline(userId) {
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
    return { account, recentTransactions };
  }

  // Optimized Logic
  async function getUserLoyaltyOptimized(userId) {
    const account = await mockPrisma.loyaltyAccount.upsert({
      where: { userId },
      update: {},
      create: { userId, points: 0, lifetime: 0 },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        }
      }
    });
    return {
      account: { ...account, transactions: undefined },
      recentTransactions: account.transactions || [],
    };
  }

  console.log('--- Profiling: getUserLoyalty ---');

  const startBaseline = Date.now();
  await getUserLoyaltyBaseline('user_123');
  const durationBaseline = Date.now() - startBaseline;
  console.log(`Baseline Duration: ${durationBaseline}ms (Expected ~100ms)`);

  const startOptimized = Date.now();
  await getUserLoyaltyOptimized('user_123');
  const durationOptimized = Date.now() - startOptimized;
  console.log(`Optimized Duration: ${durationOptimized}ms (Expected ~50ms)`);
}

profile().catch(console.error);
