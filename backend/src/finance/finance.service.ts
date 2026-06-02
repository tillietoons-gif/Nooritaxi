import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // 1. Get Commission Rules
  async getSystemCommissions() {
    return this.prisma.systemCommissionRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // 2. Set Commission Rule
  async setSystemCommission(data: { serviceType: string; commissionType: 'FIXED' | 'PERCENTAGE'; value: number; cityId?: string }) {
    return this.prisma.systemCommissionRule.create({
      data: {
        serviceType: data.serviceType,
        commissionType: data.commissionType,
        value: data.value,
        cityId: data.cityId || null,
      },
    });
  }

  // 3. Get Active Settlements (Who owes what)
  async getSettlements(status?: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'OVERDUE') {
    return this.prisma.settlement.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { name: true, phone: true } },
        fleet: { select: { companyName: true, ownerName: true, phone: true } },
      },
      orderBy: { periodEnd: 'desc' },
    });
  }

  // 4. Record Cash Collection from Driver/Fleet
  async collectCash(data: { settlementId: string; amount: number; collectedBy: string; collectedFrom: string; receiptNo?: string; notes?: string }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Cash Collection Record
      const collection = await tx.cashCollection.create({
        data: {
          settlementId: data.settlementId,
          amount: data.amount,
          collectedBy: data.collectedBy,
          collectedFrom: data.collectedFrom,
          receiptNo: data.receiptNo,
          notes: data.notes,
        },
      });

      // 2. Update Settlement Balance
      const settlement = await tx.settlement.findUnique({ where: { id: data.settlementId } });
      if (!settlement) throw new NotFoundException('Settlement not found');

      // Reduce the negative netBalance (they owe us) by the cash amount collected
      const updatedNetBalance = Number(settlement.netBalance) + Number(data.amount);
      
      let status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'OVERDUE' = settlement.status;
      if (updatedNetBalance >= 0) {
        status = 'COMPLETED';
      } else if (Number(data.amount) > 0) {
        status = 'PARTIAL';
      }

      await tx.settlement.update({
        where: { id: data.settlementId },
        data: {
          cashCollected: { increment: data.amount },
          netBalance: updatedNetBalance,
          status,
        },
      });

      return collection;
    });
  }

  // 5. Refund Requests Management
  async getRefundRequests() {
    return this.prisma.refundRequest.findMany({
      include: {
        user: { select: { name: true, phone: true } },
        trip: { select: { id: true, fare: true, createdAt: true } },
        order: { select: { id: true, total: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processRefund(id: string, data: { status: 'APPROVED' | 'REJECTED', adminId: string }) {
    return this.prisma.refundRequest.update({
      where: { id },
      data: {
        status: data.status,
        processedBy: data.adminId,
        processedAt: new Date(),
      },
    });
  }

  // 6. Financial Analytics & High-Level Reports
  async getFinanceAnalytics() {
    // Highly simplified analytics aggregations for UI
    const pendingSettlements = await this.prisma.settlement.aggregate({
      where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
      _sum: { netBalance: true },
    });

    const totalCollected = await this.prisma.cashCollection.aggregate({
      _sum: { amount: true },
    });

    return {
      outstandingReceivables: Math.abs(Number(pendingSettlements._sum.netBalance || 0)), // Cash drivers owe platform
      totalCashCollected: Number(totalCollected._sum.amount || 0),
      totalPlatformRevenue: 154000.50, // Mocked for dashboard
      activeRefunds: await this.prisma.refundRequest.count({ where: { status: 'PENDING' } }),
    };
  }
}
