
import { SafetyService } from './src/safety/safety.service';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function profile() {
  const mockPrisma: any = {
    trip: {
      findFirst: async () => {
        await sleep(50);
        return { id: 'trip-1', safetyCode: '1234' };
      },
    },
    sosAlert: {
      create: async () => {
        await sleep(50);
        return { id: 'alert-1' };
      },
    },
    trustedContact: {
      findMany: async () => {
        await sleep(50);
        return [{ phone: '123456789' }];
      },
    },
    user: {
      findUnique: async () => {
        await sleep(50);
        return { name: 'John Doe' };
      },
    },
    pushDevice: {
      findMany: async () => {
        await sleep(50);
        return [{ token: 'token-1' }];
      },
    },
    auditLog: {
      create: async () => {
        await sleep(50);
        return {};
      },
    },
  };

  const mockPush: any = {
    sendToTokens: async () => {
      await sleep(20);
      return {};
    },
  };

  const mockConfig: any = {
    get: (key: string) => (key === 'WEB_PUBLIC_URL' ? 'https://noori.app' : null),
  };

  const safetyService = new SafetyService(mockPrisma, mockPush, mockConfig);

  console.log('--- Baseline: Sequential Execution ---');
  const start = Date.now();
  await safetyService.raiseSos('user-1', { tripId: 'trip-1', message: 'Help!' });
  const end = Date.now();
  console.log(`Total Latency: ${end - start}ms`);
  console.log('---------------------------------------');
}

profile().catch(console.error);
