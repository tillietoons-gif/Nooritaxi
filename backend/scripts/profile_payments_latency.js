/**
 * Profile PaymentsService database latency improvements.
 * Simulates sequential vs parallel / merged database calls to measure/quantify performance gains.
 */
const { randomUUID } = require('crypto');

// Simulated DB delay in ms
const DB_DELAY = 50;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock Prisma service with artificial 50ms delay per query
const mockPrisma = {
  wallet: {
    async upsert() {
      await sleep(DB_DELAY);
      return { id: 'wallet_123', userId: 'user_123', currency: 'AFN' };
    },
    async findUniqueOrThrow() {
      await sleep(DB_DELAY);
      return { id: 'wallet_123', userId: 'user_123', currency: 'AFN' };
    },
  },
  transaction: {
    async create() {
      await sleep(DB_DELAY);
      return { id: 'tx_123' };
    },
    async findMany() {
      await sleep(DB_DELAY);
      return [{ id: 'tx_123' }];
    },
    async count() {
      await sleep(DB_DELAY);
      return 1;
    },
  }
};

// Original/Sequential logic mock (3 DB round-trips sequentially)
async function originalCreateIntent() {
  const start = Date.now();

  // 1. Upsert (50ms)
  await mockPrisma.wallet.upsert();
  // 2. findUniqueOrThrow (50ms)
  await mockPrisma.wallet.findUniqueOrThrow();
  // 3. create transaction (50ms)
  await mockPrisma.transaction.create();

  return Date.now() - start;
}

// Optimized/Merged logic mock (2 DB round-trips sequentially)
async function optimizedCreateIntent() {
  const start = Date.now();

  // 1. Upsert capturing wallet (50ms)
  await mockPrisma.wallet.upsert();
  // 2. create transaction (50ms)
  await mockPrisma.transaction.create();

  return Date.now() - start;
}

// Original listTransactions mock simulating sequential execution
async function originalListTransactions() {
  const start = Date.now();

  // Sequential execution simulation:
  await mockPrisma.transaction.findMany();
  await mockPrisma.transaction.count();

  return Date.now() - start;
}

// Optimized listTransactions mock using Promise.all parallel execution
async function optimizedListTransactions() {
  const start = Date.now();

  await Promise.all([
    mockPrisma.transaction.findMany(),
    mockPrisma.transaction.count()
  ]);

  return Date.now() - start;
}

async function run() {
  console.log('⚡ Starting PaymentsService Latency Profiling (50ms simulated DB delay) ⚡\n');

  console.log('--- 1. createIntent Latency ---');
  const seqCreateLatency = await originalCreateIntent();
  const optCreateLatency = await optimizedCreateIntent();
  const createReduction = ((seqCreateLatency - optCreateLatency) / seqCreateLatency * 100).toFixed(1);
  console.log(`Original Sequential createIntent: ${seqCreateLatency}ms (3 DB round-trips)`);
  console.log(`Optimized Merged createIntent:    ${optCreateLatency}ms (2 DB round-trips)`);
  console.log(`Latency Reduction:                ~${createReduction}% (Saved 1 round-trip)\n`);

  console.log('--- 2. listTransactions Latency ---');
  const seqListLatency = await originalListTransactions();
  const optListLatency = await optimizedListTransactions();
  const listReduction = ((seqListLatency - optListLatency) / seqListLatency * 100).toFixed(1);
  console.log(`Original sequential listTransactions: ${seqListLatency}ms`);
  console.log(`Optimized parallel listTransactions:   ${optListLatency}ms`);
  console.log(`Latency Reduction:                    ~${listReduction}%\n`);

  console.log('========================================================================');
  console.log('Summary of optimization gains:');
  console.log(`- createIntent:     ~${createReduction}% faster by utilizing returned upsert object.`);
  console.log(`- listTransactions: ~${listReduction}% faster by parallelizing queries with Promise.all.`);
  console.log('========================================================================');
}

run().catch(console.error);
