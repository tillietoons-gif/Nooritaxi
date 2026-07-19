const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getUserLoyalty_pre(userId) {
  const start = Date.now();

  // Simulated Query 1: upsert loyaltyAccount (50ms database delay)
  await delay(50);
  const account = { id: 'acc-1', userId, points: 0, lifetime: 0, tier: 'NOORI' };

  // Simulated Query 2: findMany loyaltyTransactions (50ms database delay)
  await delay(50);
  const recentTransactions = [];

  const duration = Date.now() - start;
  console.log(`[PRE-OPTIMIZATION] getUserLoyalty latency: ${duration}ms`);
  return { account, recentTransactions };
}

async function main() {
  console.log('Running pre-optimization profiling for getUserLoyalty...');
  await getUserLoyalty_pre('user-1');
}

main();
