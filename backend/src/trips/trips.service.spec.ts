import { Test, TestingModule } from '@nestjs/testing';
import { TripsService } from './trips.service';
import { PrismaService } from '../prisma.service';
import { PushService } from '../push/push.service';
import { WalletService } from '../wallet/wallet.service';
import { DispatchService } from '../dispatch/dispatch.service';
import { TripStatus } from '@prisma/client';

describe('TripsService', () => {
  let service: TripsService;
  let prisma: {
    surgeZone: { findMany: jest.Mock };
    $transaction: jest.Mock;
    auditLog: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      surgeZone: { findMany: jest.fn() },
      $transaction: jest.fn(),
      auditLog: { create: jest.fn() },
    };

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

    // @ts-ignore
    await expect(service.getSurgeMultiplier(34.53, 69.17)).resolves.toBe(1.4);
    // @ts-ignore
    await expect(service.getSurgeMultiplier(35, 70)).resolves.toBe(1);
  });

  it('applies acceptedAt when a driver accepts a trip', async () => {
    const tx = {
      trip: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'trip-1',
          status: TripStatus.REQUESTED,
        }),
        update: jest.fn().mockImplementation(async ({ data }: any) => ({
          id: 'trip-1',
          status: data.status,
          acceptedAt: data.acceptedAt,
        })),
      },
      driver: {
        updateMany: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback(tx),
    );

    const trip = await service.updateRide('trip-1', {
      status: TripStatus.ACCEPTED,
      actorId: 'driver-1',
    });

    expect(tx.trip.update).toHaveBeenCalledWith({
      where: { id: 'trip-1' },
      data: expect.objectContaining({
        status: TripStatus.ACCEPTED,
        acceptedAt: expect.any(Date),
      }),
    });
    expect(trip).toEqual(
      expect.objectContaining({
        id: 'trip-1',
        status: TripStatus.ACCEPTED,
        acceptedAt: expect.any(Date),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'RIDE_UPDATED',
        entityType: 'Trip',
        entityId: 'trip-1',
        actorId: 'driver-1',
      }),
    });
  });
});
