import { ForbiddenException } from '@nestjs/common';

// --- Mocks ---
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

class MockPrisma {
  trip = {
    findFirst: async () => {
      await delay(50);
      return { id: 'trip-123', safetyCode: '1234' };
    },
  };
  sosAlert = {
    create: async () => {
      await delay(50);
      return { id: 'sos-456' };
    },
  };
  trustedContact = {
    findMany: async () => {
      await delay(50);
      return [{ phone: '123456789' }];
    },
  };
  user = {
    findUnique: async () => {
      await delay(50);
      return { name: 'Test User' };
    },
  };
  pushDevice = {
    findMany: async () => {
      await delay(50);
      return [{ token: 'admin-token' }];
    },
  };
  auditLog = {
    create: async () => {
      await delay(50);
      return { id: 'audit-789' };
    },
  };
}

class MockPush {
  sendToTokens = async () => {
    await delay(50);
  };
}

class MockConfig {
  get = (key: string) => (key === 'WEB_PUBLIC_URL' ? 'https://noori.app' : null);
}

// --- SafetyService with Sequential Logic (Simplified for profiling) ---
class SafetyServiceSequential {
  constructor(private prisma: any, private push: any, private config: any) {}

  async raiseSos(userId: string, data: any) {
    let resolvedTripId: string | undefined;
    let safetyCode: string | undefined;

    if (data.tripId) {
      const trip = await this.prisma.trip.findFirst();
      if (!trip) throw new ForbiddenException('Trip not found');
      resolvedTripId = trip.id;
      safetyCode = trip.safetyCode;
    }

    const alert = await this.prisma.sosAlert.create();

    const contacts = await this.prisma.trustedContact.findMany();

    const user = await this.prisma.user.findUnique();

    const adminDevices = await this.prisma.pushDevice.findMany();

    if (adminDevices.length) {
      await this.push.sendToTokens();
    }

    await this.prisma.auditLog.create();

    return { alert, notifiedContacts: contacts.length };
  }
}

// --- SafetyService with Parallel Logic (Target Architecture) ---
class SafetyServiceParallel {
  constructor(private prisma: any, private push: any, private config: any) {}

  async raiseSos(userId: string, data: any) {
    // 1. Initial lookups in parallel
    const [trip, contacts, user, adminDevices] = await Promise.all([
      data.tripId ? this.prisma.trip.findFirst() : Promise.resolve(null),
      this.prisma.trustedContact.findMany(),
      this.prisma.user.findUnique(),
      this.prisma.pushDevice.findMany(),
    ]);

    if (data.tripId && !trip) throw new ForbiddenException('Trip not found');

    const resolvedTripId = trip?.id;
    const safetyCode = trip?.safetyCode;

    // 2. Primary Record Creation
    const alert = await this.prisma.sosAlert.create();

    // 3. Side effects in parallel
    await Promise.all([
      adminDevices.length ? this.push.sendToTokens() : Promise.resolve(),
      this.prisma.auditLog.create(),
    ]);

    return { alert, notifiedContacts: contacts.length };
  }
}

async function runProfile() {
  const prisma = new MockPrisma();
  const push = new MockPush();
  const config = new MockConfig();

  const sequential = new SafetyServiceSequential(prisma, push, config);
  const parallel = new SafetyServiceParallel(prisma, push, config);

  console.log('--- SOS Creation Latency Profile ---');

  // Baseline
  const startSeq = Date.now();
  await sequential.raiseSos('user-1', { tripId: 'trip-123' });
  const endSeq = Date.now();
  console.log(`Sequential (Baseline): ${endSeq - startSeq}ms`);

  // Optimized
  const startPar = Date.now();
  await parallel.raiseSos('user-1', { tripId: 'trip-123' });
  const endPar = Date.now();
  console.log(`Parallel (Optimized): ${endPar - startPar}ms`);

  const reduction = (((endSeq - startSeq) - (endPar - startPar)) / (endSeq - startSeq)) * 100;
  console.log(`Estimated Latency Reduction: ${reduction.toFixed(2)}%`);
}

runProfile();
