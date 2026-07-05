const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mockPrisma = {
  loyaltyAccount: {
    upsert: async (args) => {
      await sleep(50);
      const res = { id: 'acc_123', userId: 'user_123', points: 100, lifetime: 500 };
      if (args.include && args.include.transactions) {
        res.transactions = [{ id: 'tx_1', amount: 10 }];
      }
      return res;
    },
  },
  loyaltyTransaction: {
    findMany: async () => {
      await sleep(50);
      return [{ id: 'tx_1', amount: 10 }];
    },
    create: async () => {
      await sleep(50);
      return { id: 'tx_new' };
    },
  },
  $transaction: async (fn) => {
    if (Array.isArray(fn)) {
        await sleep(50 * fn.length);
        return fn;
    }
    return fn(mockPrisma);
  },
};

const POINTS_PER_FARE_UNIT = 0.1;

async function getUserLoyalty_Current(userId) {
  const start = Date.now();
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
  const end = Date.now();
  return end - start;
}

async function getUserLoyalty_Optimized(userId) {
    const start = Date.now();
    const account = await mockPrisma.loyaltyAccount.upsert({
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

async function addPointsForTrip_Current(userId, tripId, tripFare) {
  const start = Date.now();
  const pointsToAdd = Math.floor(tripFare * POINTS_PER_FARE_UNIT);
  if (pointsToAdd <= 0) return 0;

  await mockPrisma.$transaction(async (tx) => {
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
        description: `Points earned from trip #${tripId.substring(0, 8)}`,
      },
    });
  });
  const end = Date.now();
  return end - start;
}

async function addPointsForTrip_Optimized(userId, tripId, tripFare) {
    const start = Date.now();
    const pointsToAdd = Math.floor(tripFare * POINTS_PER_FARE_UNIT);
    if (pointsToAdd <= 0) return 0;

    await mockPrisma.loyaltyAccount.upsert({
        where: { userId },
        update: {
          points: { increment: pointsToAdd },
          lifetime: { increment: pointsToAdd },
          transactions: {
            create: {
              tripId: tripId,
              type: 'CREDIT',
              amount: pointsToAdd,
              description: `Points earned from trip #${tripId.substring(0, 8)}`,
            },
          },
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
              description: `Points earned from trip #${tripId.substring(0, 8)}`,
            },
          },
        },
      });
    const end = Date.now();
    return end - start;
}

async function run() {
  console.log('--- Profiling LoyaltyService ---');

  const cur1 = await getUserLoyalty_Current('user_123');
  console.log(`getUserLoyalty (Current): ${cur1}ms`);
  const opt1 = await getUserLoyalty_Optimized('user_123');
  console.log(`getUserLoyalty (Optimized): ${opt1}ms`);

  const cur2 = await addPointsForTrip_Current('user_123', 'trip_456', 1000);
  console.log(`addPointsForTrip (Current): ${cur2}ms`);
  const opt2 = await addPointsForTrip_Optimized('user_123', 'trip_456', 1000);
  console.log(`addPointsForTrip (Optimized): ${opt2}ms`);
}

run();
