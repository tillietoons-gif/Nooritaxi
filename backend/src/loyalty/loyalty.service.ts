import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LoyaltyTransactionType, Prisma } from '@prisma/client';

@Injectable()
export class LoyaltyService {
  private readonly POINTS_PER_FARE_UNIT = 0.1;

  constructor(private readonly prisma: PrismaService) {}

  async addPointsForTrip(
    userId: string,
    tripId: string,
    tripFare: number,
  ): Promise<void> {
    const pointsToAdd = Math.floor(tripFare * this.POINTS_PER_FARE_UNIT);

    if (pointsToAdd <= 0) {
      return;
    }

    // Performance Optimization: Merged upsert and transaction creation to reduce database round trips
    await this.prisma.loyaltyAccount.upsert({
      where: { userId },
      update: {
        points: { increment: pointsToAdd },
        lifetime: { increment: pointsToAdd },
        transactions: {
          create: {
            tripId,
            type: LoyaltyTransactionType.CREDIT,
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
            tripId,
            type: LoyaltyTransactionType.CREDIT,
            amount: pointsToAdd,
            description: `Points earned from trip #${tripId.substring(0, 8)}`,
          },
        },
      },
    });
  }

  async redeemPoints(userId: string, pointsToRedeem: number, reason: string) {
    if (pointsToRedeem <= 0) {
      throw new BadRequestException('Points to redeem must be positive.');
    }

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.loyaltyAccount.findUnique({
        where: { userId },
      });

      if (!account) {
        throw new NotFoundException('Loyalty account not found.');
      }

      if (account.points < pointsToRedeem) {
        throw new BadRequestException('Insufficient points balance.');
      }

      const updatedAccount = await tx.loyaltyAccount.update({
        where: { userId },
        data: {
          points: {
            decrement: pointsToRedeem,
          },
        },
      });

      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          type: LoyaltyTransactionType.DEBIT,
          amount: -pointsToRedeem,
          description: reason,
        },
      });

      return updatedAccount;
    });
  }

  async getUserLoyalty(userId: string) {
    // Performance Optimization: Merged account retrieval/creation and transaction fetching to reduce database round trips
    const account = await this.prisma.loyaltyAccount.upsert({
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

    const { transactions: recentTransactions, ...accountData } = account;
    return { account: accountData, recentTransactions };
  }

  async getAdminSummary() {
    const [
      totalAccounts,
      pointTotals,
      claimedRewards,
      tierDistribution,
      recentTransactions,
    ] = await Promise.all([
      this.prisma.loyaltyAccount.count(),
      this.prisma.loyaltyAccount.aggregate({
        _sum: { points: true, lifetime: true },
      }),
      this.prisma.loyaltyTransaction.count({
        where: { type: LoyaltyTransactionType.DEBIT },
      }),
      this.prisma.loyaltyAccount.groupBy({
        by: ['tier'],
        _count: { tier: true },
        _sum: { points: true, lifetime: true },
        orderBy: { tier: 'asc' },
      }),
      this.prisma.loyaltyTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          loyaltyAccount: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  role: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      totals: {
        enrolled: totalAccounts,
        currentPoints: pointTotals._sum.points ?? 0,
        lifetimePoints: pointTotals._sum.lifetime ?? 0,
        rewardsClaimed: claimedRewards,
      },
      tiers: tierDistribution.map((tier) => ({
        tier: tier.tier,
        members: tier._count.tier,
        currentPoints: tier._sum.points ?? 0,
        lifetimePoints: tier._sum.lifetime ?? 0,
      })),
      recentTransactions: recentTransactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        createdAt: transaction.createdAt,
        user: transaction.loyaltyAccount.user,
        account: {
          id: transaction.loyaltyAccount.id,
          tier: transaction.loyaltyAccount.tier,
          points: transaction.loyaltyAccount.points,
          lifetime: transaction.loyaltyAccount.lifetime,
        },
      })),
    };
  }
}
