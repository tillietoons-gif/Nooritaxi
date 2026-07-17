/**
 * Standalone profiling script to quantify latency reductions for PaymentsService operations.
 * Simulates database round-trip delays (e.g., 50ms per query) to establish a clear baseline
 * and compare the legacy (sequential/redundant) versus optimized execution latencies.
 */

const DB_DELAY_MS = 50;

// Helper to simulate a DB round-trip delay
const dbQuery = async (name) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, DB_DELAY_MS);
  });
};

/**
 * -------------------------------------------------------------
 * 1. createIntent Latency Profiling
 * -------------------------------------------------------------
 */
async function profileCreateIntentLegacy() {
  const start = Date.now();

  // Legacy Step 1: upsert wallet
  await dbQuery('wallet.upsert');

  // Legacy Step 2: findUniqueOrThrow (redundant query)
  await dbQuery('wallet.findUniqueOrThrow');

  // Legacy Step 3: create transaction
  await dbQuery('transaction.create');

  return Date.now() - start;
}

async function profileCreateIntentOptimized() {
  const start = Date.now();

  // Optimized Step 1: upsert wallet
  await dbQuery('wallet.upsert');

  // Optimized Step 2: create transaction directly using returned wallet
  await dbQuery('transaction.create');

  return Date.now() - start;
}

/**
 * -------------------------------------------------------------
 * 2. listTransactions Latency Profiling
 * -------------------------------------------------------------
 */
async function profileListTransactionsLegacy() {
  const start = Date.now();

  // Legacy: sequential findMany and count in Prisma $transaction block
  await dbQuery('transaction.findMany');
  await dbQuery('transaction.count');

  return Date.now() - start;
}

async function profileListTransactionsOptimized() {
  const start = Date.now();

  // Optimized: parallel findMany and count using Promise.all
  await Promise.all([
    dbQuery('transaction.findMany'),
    dbQuery('transaction.count'),
  ]);

  return Date.now() - start;
}

/**
 * -------------------------------------------------------------
 * Main Profiling Execution Flow
 * -------------------------------------------------------------
 */
async function runProfile() {
  console.log('===============================================================');
  console.log('⚡ BOLT PROFILE: PaymentsService Database Interaction Latency ⚡');
  console.log(`(Simulating artificial database round-trip delay of ${DB_DELAY_MS}ms)`);
  console.log('===============================================================\n');

  console.log('--- 1. createIntent Profile ---');
  const legacyCreateIntentTime = await profileCreateIntentLegacy();
  console.log(`Legacy createIntent Latency:    ~${legacyCreateIntentTime}ms (3 sequential DB round-trips)`);

  const optimizedCreateIntentTime = await profileCreateIntentOptimized();
  console.log(`Optimized createIntent Latency: ~${optimizedCreateIntentTime}ms (2 sequential DB round-trips)`);

  const createIntentReduction = ((legacyCreateIntentTime - optimizedCreateIntentTime) / legacyCreateIntentTime * 100).toFixed(1);
  console.log(`📊 createIntent Latency Reduction: ${createIntentReduction}% (~${legacyCreateIntentTime - optimizedCreateIntentTime}ms saved)\n`);

  console.log('--- 2. listTransactions Profile ---');
  const legacyListTransactionsTime = await profileListTransactionsLegacy();
  console.log(`Legacy listTransactions Latency:    ~${legacyListTransactionsTime}ms (2 sequential DB queries)`);

  const optimizedListTransactionsTime = await profileListTransactionsOptimized();
  console.log(`Optimized listTransactions Latency: ~${optimizedListTransactionsTime}ms (2 parallel DB queries)`);

  const listTransactionsReduction = ((legacyListTransactionsTime - optimizedListTransactionsTime) / legacyListTransactionsTime * 100).toFixed(1);
  console.log(`📊 listTransactions Latency Reduction: ${listTransactionsReduction}% (~${legacyListTransactionsTime - optimizedListTransactionsTime}ms saved)\n`);

  console.log('===============================================================');
  console.log('✨ Summary of Quantified Performance Improvements:');
  console.log(`- createIntent:     -1 database round-trip (~${DB_DELAY_MS}ms reduction in overhead)`);
  console.log(`- listTransactions: Parallelized lookup/count (~50% latency reduction)`);
  console.log('===============================================================');
}

runProfile().catch(console.error);
