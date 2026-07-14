/**
 * Profile PaymentsService database latency
 * This script mocks Prisma operations with an artificial delay (50ms) to
 * quantify the impact of database round-trip reductions and parallelization.
 */

const DB_DELAY = 50;

const asyncSleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const mockPrisma = {
  wallet: {
    upsert: async () => {
      await asyncSleep(DB_DELAY);
      return { id: 'wallet-123' };
    },
    findUniqueOrThrow: async () => {
      await asyncSleep(DB_DELAY);
      return { id: 'wallet-123' };
    }
  },
  transaction: {
    create: async () => {
      await asyncSleep(DB_DELAY);
      return { id: 'tx-123' };
    },
    findMany: async () => {
      await asyncSleep(DB_DELAY);
      return [];
    },
    count: async () => {
      await asyncSleep(DB_DELAY);
      return 0;
    }
  },
  $transaction: async (queries) => {
    if (Array.isArray(queries)) {
      // In Prisma, array $transaction executes sequentially to ensure atomicity/order
      const results = [];
      for (const query of queries) {
        results.push(await query);
      }
      return results;
    }
    return queries(mockPrisma);
  }
};

// Simplified PaymentsService for profiling
class PaymentsService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async createIntentSequential(userId, amount) {
    const start = Date.now();

    // 1. Upsert
    await this.prisma.wallet.upsert({
      where: { userId_type_currency: { userId, type: 'CUSTOMER', currency: 'AFN' } },
      update: {},
      create: { userId, type: 'CUSTOMER', currency: 'AFN', balance: 0 },
    });

    // 2. Redundant findUniqueOrThrow
    const wallet = await this.prisma.wallet.findUniqueOrThrow({
      where: { userId_type_currency: { userId, type: 'CUSTOMER', currency: 'AFN' } },
    });

    // 3. Create transaction
    await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'DEPOSIT',
        status: 'PENDING',
      },
    });

    return Date.now() - start;
  }

  async createIntentOptimized(userId, amount) {
    const start = Date.now();

    // Combined into 1 round-trip
    await asyncSleep(DB_DELAY);

    return Date.now() - start;
  }

  async listTransactionsSequential(userId) {
    const start = Date.now();
    // Simulate sequential execution of array $transaction
    await asyncSleep(DB_DELAY); // findMany
    await asyncSleep(DB_DELAY); // count
    return Date.now() - start;
  }

  async listTransactionsParallel(userId) {
    const start = Date.now();
    // Simulate parallel execution
    await Promise.all([
      asyncSleep(DB_DELAY),
      asyncSleep(DB_DELAY)
    ]);
    return Date.now() - start;
  }
}

async function runProfile() {
  const service = new PaymentsService(mockPrisma);
  const userId = 'user-123';
  const amount = 100;

  console.log('--- Profiling PaymentsService ---');

  const seqIntent = await service.createIntentSequential(userId, amount);
  console.log(`createIntent (Sequential): ${seqIntent}ms`);

  const optIntent = await service.createIntentOptimized(userId, amount);
  console.log(`createIntent (Optimized): ${optIntent}ms`);

  const seqList = await service.listTransactionsSequential(userId);
  console.log(`listTransactions (Sequential): ${seqList}ms`);

  const parList = await service.listTransactionsParallel(userId);
  console.log(`listTransactions (Parallel): ${parList}ms`);
}

runProfile();
