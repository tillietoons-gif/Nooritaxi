import { Test, TestingModule } from '@nestjs/testing';
import { TripsService } from './trips.service';
import { PrismaService } from '../prisma.service';
import { PushService } from '../push/push.service';
import { WalletService } from '../wallet/wallet.service';
import { DispatchService } from '../dispatch/dispatch.service';

describe('TripsService', () => {
  let service: TripsService;
  let prisma: { surgeZone: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { surgeZone: { findMany: jest.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PushService, useValue: { send: jest.fn() } },
        { provide: WalletService, useValue: {} },
        { provide: DispatchService, useValue: {} },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns the active surge multiplier only when pickup is inside the zone polygon', async () => {
    prisma.surgeZone.findMany.mockResolvedValue([
      {
        multiplier: 1.4,
        polygon: {
          type: 'Polygon',
          coordinates: [
            [
              [69.145, 34.49],
              [69.245, 34.49],
              [69.245, 34.56],
              [69.145, 34.56],
              [69.145, 34.49],
            ],
          ],
        },
      },
    ]);

    await expect(service.getSurgeMultiplier(34.53, 69.17)).resolves.toBe(1.4);
    await expect(service.getSurgeMultiplier(35, 70)).resolves.toBe(1);
  });
});
