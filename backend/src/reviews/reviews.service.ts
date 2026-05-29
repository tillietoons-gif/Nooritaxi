import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(data: any) {
    const review = await this.prisma.review.create({ data });
    await this.recalculateRatings(review);
    return review;
  }

  private async recalculateRatings(review: any) {
    if (review.targetType === 'DRIVER' && review.targetUserId) {
      const agg = await this.prisma.review.aggregate({
        where: { targetType: 'DRIVER', targetUserId: review.targetUserId },
        _avg: { rating: true },
      });
      if (agg._avg.rating) {
        await this.prisma.driver.update({
          where: { userId: review.targetUserId },
          data: { ratingAverage: agg._avg.rating },
        });
      }
    } else if (review.targetType === 'RIDER' && review.targetUserId) {
      const agg = await this.prisma.review.aggregate({
        where: { targetType: 'RIDER', targetUserId: review.targetUserId },
        _avg: { rating: true },
      });
      if (agg._avg.rating) {
        await this.prisma.rider.update({
          where: { userId: review.targetUserId },
          data: { ratingAverage: agg._avg.rating },
        });
      }
    } else if (review.targetType === 'RESTAURANT' && review.restaurantId) {
      const agg = await this.prisma.review.aggregate({
        where: { targetType: 'RESTAURANT', restaurantId: review.restaurantId },
        _avg: { rating: true },
      });
      if (agg._avg.rating) {
        await this.prisma.restaurant.update({
          where: { id: review.restaurantId },
          data: { ratingAverage: agg._avg.rating },
        });
      }
    }
  }
}
