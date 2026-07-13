
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const prismaMock = {
  loyaltyAccount: {
    upsert: async () => {
      await delay(50);
      return { id: 'acc_123', userId: 'user_123', points: 100, lifetime: 100, tier: 'NOORI' };
    },
  },
  loyaltyTransaction: {
    findMany: async () => {
      await delay(50);
      return [];
    },
    create: async () => {
      await delay(50);
      return { id: 'tx_123' };
    }
  },
  $transaction: async (fn) => {
    // Simplified transaction mock
    return await fn(prismaMock);
  }
};

async function original_getUserLoyalty(userId) {
  const start = Date.now();
  const account = await prismaMock.loyaltyAccount.upsert({
    where: { userId },
    update: {},
    create: { userId, points: 0, lifetime: 0 },
  });
  const recentTransactions = await prismaMock.loyaltyTransaction.findMany({
    where: { loyaltyAccountId: account.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const end = Date.now();
  return end - start;
}

async function optimized_getUserLoyalty(userId) {
  const start = Date.now();
  const accountWithTransactions = await prismaMock.loyaltyAccount.upsert({
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
  const end = Date.now();
  return end - start;
}

async function original_addPointsForTrip(userId, tripId, pointsToAdd) {
  const start = Date.now();
  await prismaMock.$transaction(async (tx) => {
    const loyaltyAccount = await tx.loyaltyAccount.upsert({
      where: { userId },
      update: { points: { increment: pointsToAdd }, lifetime: { increment: pointsToAdd } },
      create: { userId, points: pointsToAdd, lifetime: pointsToAdd },
    });

    await tx.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: loyaltyAccount.id,
        tripId: tripId,
        type: 'CREDIT',
        amount: pointsToAdd,
        description: `Points earned from trip #${tripId}`,
      },
    });
  });
  const end = Date.now();
  return end - start;
}

async function optimized_addPointsForTrip(userId, tripId, pointsToAdd) {
  const start = Date.now();
  // Using nested create in upsert to avoid explicit $transaction and 2nd round trip
  await prismaMock.loyaltyAccount.upsert({
    where: { userId },
    update: {
      points: { increment: pointsToAdd },
      lifetime: { increment: pointsToAdd },
      transactions: {
        create: {
          tripId: tripId,
          type: 'CREDIT',
          amount: pointsToAdd,
          description: `Points earned from trip #${tripId}`,
        }
      }
    },
    create: {
      userId,
      points: pointsToAdd,
      lifetime: pointsToAdd,
      transactions: {
        create: {
          tripId: tripId,
          type: 'CREDIT',
          amount: pointsToAdd,
          description: `Points earned from trip #${tripId}`,
        }
      }
    },
  });
  const end = Date.now();
  return end - start;
}

async function run() {
  console.log('--- Baseline (Sequential) ---');
  const t1 = await original_getUserLoyalty('user_1');
  console.log(`getUserLoyalty: ${t1}ms`);
  const t2 = await original_addPointsForTrip('user_1', 'trip_1', 10);
  console.log(`addPointsForTrip: ${t2}ms`);

  console.log('\n--- Optimized (Single Round-trip) ---');
  const t3 = await optimized_getUserLoyalty('user_1');
  console.log(`getUserLoyalty: ${t3}ms`);
  const t4 = await optimized_addPointsForTrip('user_1', 'trip_1', 10);
  console.log(`addPointsForTrip: ${t4}ms`);
}

run();
