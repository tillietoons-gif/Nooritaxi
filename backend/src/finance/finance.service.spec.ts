import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';
import { PrismaService } from '../prisma.service';

describe('FinanceService', () => {
  let service: FinanceService;

  const mockPrisma = {
    settlement: {
      aggregate: jest.fn(),
    },
    cashCollection: {
      aggregate: jest.fn(),
    },
    refundRequest: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFinanceAnalytics', () => {
    it('should return finance analytics by calling prisma methods', async () => {
      mockPrisma.settlement.aggregate.mockResolvedValue({
        _sum: { netBalance: -5000 },
      });
      mockPrisma.cashCollection.aggregate.mockResolvedValue({
        _sum: { amount: 10000 },
      });
      mockPrisma.refundRequest.count.mockResolvedValue(5);

      const result = await service.getFinanceAnalytics();

      expect(result).toEqual({
        outstandingReceivables: 5000,
        totalCashCollected: 10000,
        totalPlatformRevenue: 154000.5,
        activeRefunds: 5,
      });

      expect(mockPrisma.settlement.aggregate).toHaveBeenCalled();
      expect(mockPrisma.cashCollection.aggregate).toHaveBeenCalled();
      expect(mockPrisma.refundRequest.count).toHaveBeenCalled();
    });

    it('should handle null values from aggregation', async () => {
      mockPrisma.settlement.aggregate.mockResolvedValue({
        _sum: { netBalance: null },
      });
      mockPrisma.cashCollection.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });
      mockPrisma.refundRequest.count.mockResolvedValue(0);

      const result = await service.getFinanceAnalytics();

      expect(result.outstandingReceivables).toBe(0);
      expect(result.totalCashCollected).toBe(0);
      expect(result.activeRefunds).toBe(0);
    });
  });
});
