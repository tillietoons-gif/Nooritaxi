import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyService } from './loyalty.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LoyaltyTransactionType } from '@prisma/client';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let prisma: any;

  const mockPrismaService = {
    loyaltyAccount: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    loyaltyTransaction: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks before each test
    jest.clearAllMocks();
    mockPrismaService.loyaltyAccount.upsert.mockReset();
    mockPrismaService.loyaltyAccount.findUnique.mockReset();
    mockPrismaService.loyaltyAccount.update.mockReset();
    mockPrismaService.loyaltyAccount.count.mockReset();
    mockPrismaService.loyaltyAccount.aggregate.mockReset();
    mockPrismaService.loyaltyAccount.groupBy.mockReset();
    mockPrismaService.loyaltyTransaction.findMany.mockReset();
    mockPrismaService.loyaltyTransaction.create.mockReset();
    mockPrismaService.loyaltyTransaction.count.mockReset();
    mockPrismaService.$transaction.mockImplementation((cb) => cb(mockPrismaService));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addPointsForTrip', () => {
    it('should return early if points to add is 0 or less', async () => {
      const upsertSpy = jest.spyOn(prisma.loyaltyAccount, 'upsert');
      await service.addPointsForTrip('user-1', 'trip-1', 5); // 5 * 0.1 = 0.5 -> 0 points
      expect(upsertSpy).not.toHaveBeenCalled();
    });

    it('should call upsert with correct nested write arguments for positive points', async () => {
      const upsertSpy = jest.spyOn(prisma.loyaltyAccount, 'upsert');
      upsertSpy.mockResolvedValue({ id: 'acc-1', userId: 'user-1', points: 50, lifetime: 50 });

      await service.addPointsForTrip('user-1', 'trip-1', 500); // 500 * 0.1 = 50 points

      expect(upsertSpy).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: {
          points: { increment: 50 },
          lifetime: { increment: 50 },
          transactions: {
            create: {
              tripId: 'trip-1',
              type: LoyaltyTransactionType.CREDIT,
              amount: 50,
              description: 'Points earned from trip #trip-1',
            },
          },
        },
        create: {
          userId: 'user-1',
          points: 50,
          lifetime: 50,
          transactions: {
            create: {
              tripId: 'trip-1',
              type: LoyaltyTransactionType.CREDIT,
              amount: 50,
              description: 'Points earned from trip #trip-1',
            },
          },
        },
      });
    });
  });

  describe('getUserLoyalty', () => {
    it('should correctly call upsert with transaction include and format return object', async () => {
      const upsertSpy = jest.spyOn(prisma.loyaltyAccount, 'upsert');
      const mockResult = {
        id: 'acc-1',
        userId: 'user-1',
        points: 100,
        lifetime: 200,
        tier: 'SILVER',
        transactions: [
          { id: 'tx-1', amount: 50, description: 'Trip 1', createdAt: new Date() },
        ],
      };
      upsertSpy.mockResolvedValue(mockResult);

      const result = await service.getUserLoyalty('user-1');

      expect(upsertSpy).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: {},
        create: { userId: 'user-1', points: 0, lifetime: 0 },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });

      expect(result).toEqual({
        account: { id: 'acc-1', userId: 'user-1', points: 100, lifetime: 200, tier: 'SILVER' },
        recentTransactions: mockResult.transactions,
      });
    });
  });

  describe('redeemPoints', () => {
    it('should throw BadRequestException if points to redeem is 0 or less', async () => {
      await expect(service.redeemPoints('user-1', 0, 'Gift')).rejects.toThrow(BadRequestException);
      await expect(service.redeemPoints('user-1', -10, 'Gift')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if loyalty account does not exist', async () => {
      jest.spyOn(prisma.loyaltyAccount, 'findUnique').mockResolvedValue(null);
      await expect(service.redeemPoints('user-1', 50, 'Gift')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if points balance is insufficient', async () => {
      jest.spyOn(prisma.loyaltyAccount, 'findUnique').mockResolvedValue({ id: 'acc-1', points: 30 });
      await expect(service.redeemPoints('user-1', 50, 'Gift')).rejects.toThrow(BadRequestException);
    });

    it('should successfully update points and create debit transaction', async () => {
      jest.spyOn(prisma.loyaltyAccount, 'findUnique').mockResolvedValue({ id: 'acc-1', userId: 'user-1', points: 100 });
      const updateSpy = jest.spyOn(prisma.loyaltyAccount, 'update').mockResolvedValue({ id: 'acc-1', points: 40 });
      const createTxSpy = jest.spyOn(prisma.loyaltyTransaction, 'create');

      const result = await service.redeemPoints('user-1', 60, 'Coffee cup');

      expect(updateSpy).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { points: { decrement: 60 } },
      });
      expect(createTxSpy).toHaveBeenCalledWith({
        data: {
          loyaltyAccountId: 'acc-1',
          type: LoyaltyTransactionType.DEBIT,
          amount: -60,
          description: 'Coffee cup',
        },
      });
      expect(result).toEqual({ id: 'acc-1', points: 40 });
    });
  });

  describe('getAdminSummary', () => {
    it('should return complete admin loyalty statistics', async () => {
      jest.spyOn(prisma.loyaltyAccount, 'count').mockResolvedValue(5);
      jest.spyOn(prisma.loyaltyAccount, 'aggregate').mockResolvedValue({ _sum: { points: 500, lifetime: 1200 } });
      jest.spyOn(prisma.loyaltyTransaction, 'count').mockResolvedValue(3);
      jest.spyOn(prisma.loyaltyAccount, 'groupBy').mockResolvedValue([
        { tier: 'BRONZE', _count: { tier: 3 }, _sum: { points: 100, lifetime: 300 } },
        { tier: 'SILVER', _count: { tier: 2 }, _sum: { points: 400, lifetime: 900 } },
      ]);
      jest.spyOn(prisma.loyaltyTransaction, 'findMany').mockResolvedValue([
        {
          id: 'tx-1',
          type: 'CREDIT',
          amount: 50,
          description: 'Trip 1',
          createdAt: new Date(),
          loyaltyAccount: {
            id: 'acc-1',
            tier: 'BRONZE',
            points: 50,
            lifetime: 50,
            user: { id: 'u-1', name: 'Alim', phone: '+9371', role: 'RIDER' },
          },
        },
      ]);

      const summary = await service.getAdminSummary();

      expect(summary.totals).toEqual({
        enrolled: 5,
        currentPoints: 500,
        lifetimePoints: 1200,
        rewardsClaimed: 3,
      });

      expect(summary.tiers).toEqual([
        { tier: 'BRONZE', members: 3, currentPoints: 100, lifetimePoints: 300 },
        { tier: 'SILVER', members: 2, currentPoints: 400, lifetimePoints: 900 },
      ]);

      expect(summary.recentTransactions[0]).toEqual(expect.objectContaining({
        id: 'tx-1',
        type: 'CREDIT',
        amount: 50,
        description: 'Trip 1',
        user: { id: 'u-1', name: 'Alim', phone: '+9371', role: 'RIDER' },
        account: { id: 'acc-1', tier: 'BRONZE', points: 50, lifetime: 50 },
      }));
    });
  });
});
