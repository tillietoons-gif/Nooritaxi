import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FraudService {
  constructor(private prisma: PrismaService) {}

  // 1. Dashboard Analytics
  async getDashboardAnalytics() {
    const totalAlerts = await this.prisma.fraudAlert.count({ where: { isResolved: false } });
    const openCases = await this.prisma.fraudCase.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } });
    const criticalScores = await this.prisma.fraudScore.count({ where: { riskLevel: 'CRITICAL' } });

    // Mock trend analytics for the dashboard
    return {
      totalAlerts,
      openCases,
      criticalRiskEntities: criticalScores,
      trends: {
        gpsSpoofing: 45,
        duplicateAccounts: 12,
        referralAbuse: 89,
        financialFraud: 24,
      }
    };
  }

  // 2. Fraud Alerts Management
  async getAlerts(status: 'OPEN' | 'RESOLVED' = 'OPEN') {
    return this.prisma.fraudAlert.findMany({
      where: { isResolved: status === 'RESOLVED' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, ratingAverage: true, user: { select: { name: true, phone: true } } } },
      }
    });
  }

  async resolveAlert(id: string) {
    return this.prisma.fraudAlert.update({
      where: { id },
      data: { isResolved: true }
    });
  }

  // 3. Case Management
  async getCases() {
    return this.prisma.fraudCase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { name: true } },
        targetUser: { select: { name: true, phone: true } },
        targetDriver: { select: { user: { select: { name: true } } } },
      }
    });
  }

  async getCaseDetails(id: string) {
    const fraudCase = await this.prisma.fraudCase.findUnique({
      where: { id },
      include: {
        alerts: true,
        notes: {
          include: { author: { select: { name: true } } },
          orderBy: { createdAt: 'asc' }
        },
        targetUser: true,
        targetDriver: { include: { user: true } },
      }
    });

    if (!fraudCase) throw new NotFoundException('Case not found');
    return fraudCase;
  }

  async addCaseNote(caseId: string, authorId: string, content: string) {
    return this.prisma.investigationNote.create({
      data: {
        caseId,
        authorId,
        content
      }
    });
  }

  // 4. Blacklist Management
  async getBlacklist() {
    return this.prisma.blacklist.findMany({
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { name: true } } }
    });
  }

  async addBlacklist(adminId: string, type: string, value: string, reason: string) {
    return this.prisma.blacklist.create({
      data: {
        type,
        value,
        reason,
        addedBy: adminId
      }
    });
  }

  // 5. Risk Scoring & Devices
  async getHighRiskAccounts() {
    return this.prisma.fraudScore.findMany({
      where: { riskLevel: { in: ['HIGH', 'CRITICAL'] } },
      orderBy: { score: 'desc' },
      include: {
        user: { select: { name: true, phone: true } },
        driver: { select: { user: { select: { name: true, phone: true } } } },
      }
    });
  }

  async getDevices() {
    return this.prisma.deviceFingerprint.findMany({
      orderBy: { lastSeenAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true, phone: true } } }
    });
  }
}
