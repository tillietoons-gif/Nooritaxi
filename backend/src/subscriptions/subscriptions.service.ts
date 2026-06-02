import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async createPlan(data: any) {
    return this.prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        price: data.price,
        billingCycle: data.billingCycle,
        features: data.features,
        isActive: data.isActive ?? true
      }
    });
  }

  async getActiveSubscriptions() {
    return this.prisma.activeSubscription.findMany({
      where: { status: 'ACTIVE' },
      include: {
        plan: true,
        user: { select: { name: true, phone: true } },
        driver: { select: { user: { select: { name: true } } } }
      }
    });
  }

  async assignSubscription(data: any) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: data.planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const endDate = new Date();
    if (plan.billingCycle === 'MONTHLY') endDate.setMonth(endDate.getMonth() + 1);
    if (plan.billingCycle === 'YEARLY') endDate.setFullYear(endDate.getFullYear() + 1);

    return this.prisma.activeSubscription.create({
      data: {
        planId: plan.id,
        userId: data.userId,
        driverId: data.driverId,
        merchantId: data.merchantId,
        endDate,
      }
    });
  }
}
