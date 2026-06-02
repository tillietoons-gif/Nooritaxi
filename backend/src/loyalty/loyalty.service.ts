import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LoyaltyTransactionType, Prisma } from '@prisma/client';

@Injectable()
export class LoyaltyService {
  private readonly POINTS_PER_FARE_UNIT = 0.1;

  constructor(private readonly prisma: PrismaService) {}

  async addPointsForTrip(userId: string, tripId: string, tripFare: number): Promise<void> {
    const pointsToAdd = Math.floor(tripFare * this.POINTS_PER_FARE_UNIT);

    if (pointsToAdd <= 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const loyaltyAccount = await tx.loyaltyAccount.upsert({
        where: { userId },
        update: {
          points: {
            increment: pointsToAdd,
          },
          lifetime: {
            increment: pointsToAdd,
          }
        },
        create: {
          userId,
          points: pointsToAdd,
          lifetime: pointsToAdd
        },
      });

      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: loyaltyAccount.id,
          tripId: tripId,
          type: LoyaltyTransactionType.CREDIT,
          amount: pointsToAdd,
          description: `Points earned from trip #${tripId.substring(0, 8)}`,
        },
      });
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
}
