const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getUserLoyalty_post(userId) {
  const start = Date.now();

  // Simulated Query 1: upsert loyaltyAccount WITH include (single 50ms database delay)
  await delay(50);
  const account = {
    id: 'acc-1',
    userId,
    points: 0,
    lifetime: 0,
    tier: 'NOORI',
    transactions: []
  };

  const { transactions: recentTransactions, ...accountWithoutTransactions } = account;

  const duration = Date.now() - start;
  console.log(`[POST-OPTIMIZATION] getUserLoyalty latency: ${duration}ms`);
  return { account: accountWithoutTransactions, recentTransactions };
}

async function main() {
  console.log('Running post-optimization profiling for getUserLoyalty...');
  await getUserLoyalty_post('user-1');
}

main();
