import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MarketingService {
  constructor(private prisma: PrismaService) {}

  // ==========================
  // Promotions & Coupons
  // ==========================

  async getPromotions() {
    return this.prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPromotion(data: any) {
    return this.prisma.promotion.create({
      data: {
        code: data.code.toUpperCase(),
        title: data.title,
        description: data.description,
        type: data.type, // PERCENTAGE, FIXED_AMOUNT, FREE_DELIVERY
        scope: data.scope || 'GLOBAL',
        value: data.value,
        maxDiscount: data.maxDiscount,
        minSpend: data.minSpend,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit || 1,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        isActive: data.isActive ?? true,
      },
    });
  }

  async togglePromotionStatus(id: string, isActive: boolean) {
    return this.prisma.promotion.update({
      where: { id },
      data: { isActive },
    });
  }

  async getPromotionRedemptions(id: string) {
    return this.prisma.promotionRedemption.findMany({
      where: { promotionId: id },
      include: {
        user: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================
  // Campaigns (Push / SMS)
  // ==========================

  async getCampaigns() {
    return this.prisma.communicationBroadcast.findMany({
      where: { targetAudience: { in: ['RIDERS', 'ALL_USERS', 'MERCHANTS'] } },
      orderBy: { createdAt: 'desc' },
      include: { sentBy: { select: { name: true } } },
    });
  }

  // Uses the existing Broadcast model from Operations
  async createCampaign(data: {
    title: string;
    message: string;
    targetAudience: string;
    channels: string[];
    adminId: string;
  }) {
    return this.prisma.communicationBroadcast.create({
      data: {
        title: data.title,
        message: data.message,
        targetAudience: data.targetAudience,
        channels: data.channels,
        sentById: data.adminId,
      },
    });
  }
}
