// Mocking Prisma to simulate network latency
const mockPrisma = {
  loyaltyAccount: {
    upsert: async () => {
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms simulated delay
      return { id: 'acc_123', userId: 'user_123', points: 100, lifetime: 1000 };
    }
  },
  loyaltyTransaction: {
    findMany: async () => {
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms simulated delay
      return [{ id: 'tx_1', amount: 10 }];
    }
  }
};

async function sequential() {
  const start = Date.now();
  const account = await mockPrisma.loyaltyAccount.upsert({
    where: { userId: 'user_123' },
    update: {},
    create: { userId: 'user_123', points: 0, lifetime: 0 },
  });
  const recentTransactions = await mockPrisma.loyaltyTransaction.findMany({
    where: { loyaltyAccountId: account.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const end = Date.now();
  return end - start;
}

const mockPrismaOptimized = {
  loyaltyAccount: {
    upsert: async (args) => {
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms simulated delay
      const result = { id: 'acc_123', userId: 'user_123', points: 100, lifetime: 1000 };
      if (args.include && args.include.transactions) {
        result.transactions = [{ id: 'tx_1', amount: 10 }];
      }
      return result;
    }
  }
};

async function optimized() {
  const start = Date.now();
  const result = await mockPrismaOptimized.loyaltyAccount.upsert({
    where: { userId: 'user_123' },
    update: {},
    create: { userId: 'user_123', points: 0, lifetime: 0 },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
  const end = Date.now();
  return end - start;
}

async function run() {
  console.log('Profiling LoyaltyService.getUserLoyalty latency...');

  const seqTimes = [];
  for(let i=0; i<10; i++) seqTimes.push(await sequential());
  const avgSeq = seqTimes.reduce((a, b) => a + b) / seqTimes.length;

  const optTimes = [];
  for(let i=0; i<10; i++) optTimes.push(await optimized());
  const avgOpt = optTimes.reduce((a, b) => a + b) / optTimes.length;

  console.log(`Average Sequential Latency: ${avgSeq.toFixed(2)}ms`);
  console.log(`Average Optimized Latency: ${avgOpt.toFixed(2)}ms`);
  console.log(`Reduction: ${(((avgSeq - avgOpt) / avgSeq) * 100).toFixed(2)}%`);
}

run();
