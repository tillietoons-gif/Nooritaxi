import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { PrismaService } from '../prisma.service';

describe('SupportService', () => {
  let service: SupportService;
  let prisma: PrismaService;

  const mockPrismaService = {
    supportTicket: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('should return dashboard metrics with correct counts', async () => {
      const countMock = prisma.supportTicket.count as jest.Mock;
      countMock
        .mockResolvedValueOnce(10) // totalOpen
        .mockResolvedValueOnce(5) // totalUrgent
        .mockResolvedValueOnce(3); // resolvedToday

      const result = await service.getDashboardMetrics();

      expect(result).toEqual({
        totalOpen: 10,
        totalUrgent: 5,
        resolvedToday: 3,
        averageResolutionTimeHours: 4.2,
      });

      expect(countMock).toHaveBeenCalledTimes(3);

      expect(countMock).toHaveBeenCalledWith({
        where: { status: 'OPEN' },
      });
      expect(countMock).toHaveBeenCalledWith({
        where: { priority: 'URGENT', status: { not: 'CLOSED' } },
      });
      expect(countMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'RESOLVED' }),
        }),
      );
    });
  });
});
