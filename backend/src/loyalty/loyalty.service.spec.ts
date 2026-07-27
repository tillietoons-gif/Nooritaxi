import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyService } from './loyalty.service';
import { PrismaService } from '../prisma.service';
import { LoyaltyTransactionType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let prisma: {
    loyaltyAccount: {
      upsert: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      aggregate: jest.Mock;
      groupBy: jest.Mock;
    };
    loyaltyTransaction: {
      create: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      loyaltyAccount: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      loyaltyTransaction: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addPointsForTrip', () => {
    it('should early-exit if computed points to add are less than or equal to zero', async () => {
      await service.addPointsForTrip('user-1', 'trip-1', 5); // 5 * 0.1 = 0 points
      expect(prisma.loyaltyAccount.upsert).not.toHaveBeenCalled();
    });

    it('should upsert loyalty account with nested transaction write for valid points', async () => {
      await service.addPointsForTrip('user-1', 'trip-1', 150); // 150 * 0.1 = 15 points
      expect(prisma.loyaltyAccount.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: {
          points: { increment: 15 },
          lifetime: { increment: 15 },
          transactions: {
            create: {
              tripId: 'trip-1',
              type: LoyaltyTransactionType.CREDIT,
              amount: 15,
              description: 'Points earned from trip #trip-1',
            },
          },
        },
        create: {
          userId: 'user-1',
          points: 15,
          lifetime: 15,
          transactions: {
            create: {
              tripId: 'trip-1',
              type: LoyaltyTransactionType.CREDIT,
              amount: 15,
              description: 'Points earned from trip #trip-1',
            },
          },
        },
      });
    });
  });

  describe('redeemPoints', () => {
    it('should throw BadRequestException if points to redeem is 0 or negative', async () => {
      await expect(service.redeemPoints('user-1', -10, 'Gift')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.redeemPoints('user-1', 0, 'Gift')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if loyalty account does not exist', async () => {
      const tx = {
        loyaltyAccount: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };
      prisma.$transaction.mockImplementation(async (cb) => cb(tx));

      await expect(service.redeemPoints('user-1', 50, 'Gift')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if points balance is insufficient', async () => {
      const tx = {
        loyaltyAccount: {
          findUnique: jest.fn().mockResolvedValue({ id: 'acc-1', points: 30 }),
        },
      };
      prisma.$transaction.mockImplementation(async (cb) => cb(tx));

      await expect(service.redeemPoints('user-1', 50, 'Gift')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update account points and create transaction when balance is sufficient', async () => {
      const tx = {
        loyaltyAccount: {
          findUnique: jest.fn().mockResolvedValue({ id: 'acc-1', points: 100 }),
          update: jest.fn().mockResolvedValue({ id: 'acc-1', points: 50 }),
        },
        loyaltyTransaction: {
          create: jest.fn(),
        },
      };
      prisma.$transaction.mockImplementation(async (cb) => cb(tx));

      const result = await service.redeemPoints('user-1', 50, 'Gift');
      expect(tx.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { points: { decrement: 50 } },
      });
      expect(tx.loyaltyTransaction.create).toHaveBeenCalledWith({
        data: {
          loyaltyAccountId: 'acc-1',
          type: LoyaltyTransactionType.DEBIT,
          amount: -50,
          description: 'Gift',
        },
      });
      expect(result).toEqual({ id: 'acc-1', points: 50 });
    });
  });

  describe('getUserLoyalty', () => {
    it('should upsert account and include transactions', async () => {
      prisma.loyaltyAccount.upsert.mockResolvedValue({
        id: 'acc-1',
        userId: 'user-1',
        points: 100,
        lifetime: 100,
        tier: 'NOORI',
        transactions: [
          { id: 'tx-1', amount: 10, type: LoyaltyTransactionType.CREDIT },
        ],
      });

      const res = await service.getUserLoyalty('user-1');
      expect(prisma.loyaltyAccount.upsert).toHaveBeenCalledWith({
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
      expect(res.account).toEqual({
        id: 'acc-1',
        userId: 'user-1',
        points: 100,
        lifetime: 100,
        tier: 'NOORI',
      });
      expect(res.recentTransactions).toEqual([
        { id: 'tx-1', amount: 10, type: LoyaltyTransactionType.CREDIT },
      ]);
    });
  });

  describe('getAdminSummary', () => {
    it('should aggregate and parallelize admin dashboard metrics', async () => {
      prisma.loyaltyAccount.count.mockResolvedValue(10);
      prisma.loyaltyAccount.aggregate.mockResolvedValue({
        _sum: { points: 500, lifetime: 1200 },
      });
      prisma.loyaltyTransaction.count.mockResolvedValue(2);
      prisma.loyaltyAccount.groupBy.mockResolvedValue([
        { tier: 'NOORI', _count: { tier: 8 }, _sum: { points: 100, lifetime: 200 } },
        { tier: 'SILVER', _count: { tier: 2 }, _sum: { points: 400, lifetime: 1000 } },
      ]);
      prisma.loyaltyTransaction.findMany.mockResolvedValue([
        {
          id: 'tx-1',
          type: LoyaltyTransactionType.CREDIT,
          amount: 50,
          description: 'Trip earnings',
          createdAt: new Date('2025-01-01'),
          loyaltyAccount: {
            id: 'acc-1',
            tier: 'SILVER',
            points: 200,
            lifetime: 500,
            user: { id: 'u-1', name: 'Kabir', phone: '+93700000001', role: 'RIDER' },
          },
        },
      ]);

      const summary = await service.getAdminSummary();

      expect(prisma.loyaltyAccount.count).toHaveBeenCalled();
      expect(prisma.loyaltyAccount.aggregate).toHaveBeenCalledWith({
        _sum: { points: true, lifetime: true },
      });
      expect(prisma.loyaltyTransaction.count).toHaveBeenCalledWith({
        where: { type: LoyaltyTransactionType.DEBIT },
      });
      expect(prisma.loyaltyAccount.groupBy).toHaveBeenCalledWith({
        by: ['tier'],
        _count: { tier: true },
        _sum: { points: true, lifetime: true },
        orderBy: { tier: 'asc' },
      });
      expect(prisma.loyaltyTransaction.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          loyaltyAccount: {
            include: {
              user: {
                select: { id: true, name: true, phone: true, role: true },
              },
            },
          },
        },
      });

      expect(summary.totals).toEqual({
        enrolled: 10,
        currentPoints: 500,
        lifetimePoints: 1200,
        rewardsClaimed: 2,
      });
      expect(summary.tiers).toEqual([
        { tier: 'NOORI', members: 8, currentPoints: 100, lifetimePoints: 200 },
        { tier: 'SILVER', members: 2, currentPoints: 400, lifetimePoints: 1000 },
      ]);
      expect(summary.recentTransactions).toHaveLength(1);
      expect(summary.recentTransactions[0]).toEqual({
        id: 'tx-1',
        type: LoyaltyTransactionType.CREDIT,
        amount: 50,
        description: 'Trip earnings',
        createdAt: expect.any(Date),
        user: { id: 'u-1', name: 'Kabir', phone: '+93700000001', role: 'RIDER' },
        account: {
          id: 'acc-1',
          tier: 'SILVER',
          points: 200,
          lifetime: 500,
        },
      });
    });
  });
});
