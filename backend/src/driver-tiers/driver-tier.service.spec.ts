import { Test, TestingModule } from '@nestjs/testing';
import { DriverTierService } from './driver-tier.service';
import { PrismaService } from '../prisma.service';
import { DriverTier } from '@prisma/client';

describe('DriverTierService', () => {
  let service: DriverTierService;

  const mockPrismaService = {
    driverTierConfig: {
      findMany: jest.fn(),
    },
    driver: {
      updateMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverTierService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DriverTierService>(DriverTierService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleUpdateDriverTiers', () => {
    it('should abort if no driver tier configurations are found', async () => {
      mockPrismaService.driverTierConfig.findMany.mockResolvedValue([]);
      const warnSpy = jest.spyOn(
        (service as unknown as { logger: { warn: jest.Mock } }).logger,
        'warn',
      );

      await service.handleUpdateDriverTiers();

      expect(mockPrismaService.driverTierConfig.findMany).toHaveBeenCalled();
      expect(mockPrismaService.driver.updateMany).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No driver tier configurations found'),
      );
    });

    it('should correctly partition drivers and call updateMany in parallel', async () => {
      const mockConfigs = [
        { tier: DriverTier.PLATINUM, minTrips: 1000, minRating: 4.85 },
        { tier: DriverTier.GOLD, minTrips: 500, minRating: 4.7 },
        { tier: DriverTier.SILVER, minTrips: 100, minRating: 4.5 },
        { tier: DriverTier.BRONZE, minTrips: 0, minRating: 0 },
      ];

      mockPrismaService.driverTierConfig.findMany.mockResolvedValue(
        mockConfigs,
      );
      mockPrismaService.driver.updateMany.mockResolvedValue({ count: 2 });

      await service.handleUpdateDriverTiers();

      expect(mockPrismaService.driverTierConfig.findMany).toHaveBeenCalledWith({
        orderBy: { minTrips: 'desc' },
      });

      // Verify each tier config maps to an updateMany call with correct exclusion criteria
      expect(mockPrismaService.driver.updateMany).toHaveBeenCalledTimes(4);

      // PLATINUM (no higher tiers to exclude)
      expect(mockPrismaService.driver.updateMany).toHaveBeenCalledWith({
        where: {
          completedTrips: { gte: 1000 },
          ratingAverage: { gte: 4.85 },
          tier: { not: DriverTier.PLATINUM },
        },
        data: { tier: DriverTier.PLATINUM },
      });

      // GOLD (excludes PLATINUM)
      expect(mockPrismaService.driver.updateMany).toHaveBeenCalledWith({
        where: {
          completedTrips: { gte: 500 },
          ratingAverage: { gte: 4.7 },
          NOT: { completedTrips: { gte: 1000 }, ratingAverage: { gte: 4.85 } },
          tier: { not: DriverTier.GOLD },
        },
        data: { tier: DriverTier.GOLD },
      });

      // SILVER (excludes PLATINUM and GOLD)
      expect(mockPrismaService.driver.updateMany).toHaveBeenCalledWith({
        where: {
          completedTrips: { gte: 100 },
          ratingAverage: { gte: 4.5 },
          NOT: [
            { completedTrips: { gte: 1000 }, ratingAverage: { gte: 4.85 } },
            { completedTrips: { gte: 500 }, ratingAverage: { gte: 4.7 } },
          ],
          tier: { not: DriverTier.SILVER },
        },
        data: { tier: DriverTier.SILVER },
      });

      // BRONZE (excludes PLATINUM, GOLD, and SILVER)
      expect(mockPrismaService.driver.updateMany).toHaveBeenCalledWith({
        where: {
          completedTrips: { gte: 0 },
          ratingAverage: { gte: 0 },
          NOT: [
            { completedTrips: { gte: 1000 }, ratingAverage: { gte: 4.85 } },
            { completedTrips: { gte: 500 }, ratingAverage: { gte: 4.7 } },
            { completedTrips: { gte: 100 }, ratingAverage: { gte: 4.5 } },
          ],
          tier: { not: DriverTier.BRONZE },
        },
        data: { tier: DriverTier.BRONZE },
      });
    });
  });

  describe('getAdminSummary', () => {
    it('should return aggregated admin summary statistics', async () => {
      mockPrismaService.driver.count
        .mockResolvedValueOnce(150) // totalDrivers
        .mockResolvedValueOnce(10); // atRisk

      mockPrismaService.driver.aggregate.mockResolvedValue({
        _avg: {
          ratingAverage: 4.65,
          completedTrips: 250,
          completedDeliveries: 45,
        },
      });

      mockPrismaService.driver.groupBy.mockResolvedValue([
        {
          tier: DriverTier.BRONZE,
          _count: { tier: 80 },
          _avg: { ratingAverage: 4.2, completedTrips: 50 },
          _sum: { completedTrips: 4000, completedDeliveries: 200 },
        },
        {
          tier: DriverTier.GOLD,
          _count: { tier: 70 },
          _avg: { ratingAverage: 4.8, completedTrips: 600 },
          _sum: { completedTrips: 42000, completedDeliveries: 1200 },
        },
      ]);

      mockPrismaService.driverTierConfig.findMany.mockResolvedValue([
        { tier: DriverTier.BRONZE, minTrips: 0, minRating: 0 },
        { tier: DriverTier.SILVER, minTrips: 100, minRating: 4.5 },
        { tier: DriverTier.GOLD, minTrips: 500, minRating: 4.7 },
        { tier: DriverTier.PLATINUM, minTrips: 1000, minRating: 4.85 },
      ]);

      const result = await service.getAdminSummary();

      expect(mockPrismaService.driver.count).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.driver.aggregate).toHaveBeenCalled();
      expect(mockPrismaService.driver.groupBy).toHaveBeenCalled();
      expect(mockPrismaService.driverTierConfig.findMany).toHaveBeenCalled();

      expect(result.totals).toEqual({
        totalDrivers: 150,
        averageRating: 4.65,
        averageCompletedTrips: 250,
        averageCompletedDeliveries: 45,
        atRiskDrivers: 10,
      });

      expect(result.configSource).toBe('database');
      expect(result.tiers).toHaveLength(4);

      // Verify mapped BRONZE details
      const bronzeTier = result.tiers.find((t) => t.tier === DriverTier.BRONZE);
      expect(bronzeTier).toBeDefined();
      expect(bronzeTier?.drivers).toBe(80);
      expect(bronzeTier?.averageRating).toBe(4.2);
      expect(bronzeTier?.averageTrips).toBe(50);
      expect(bronzeTier?.completedTrips).toBe(4000);
      expect(bronzeTier?.completedDeliveries).toBe(200);

      // Verify unmapped SILVER details (should use defaults / zero-values for stats)
      const silverTier = result.tiers.find((t) => t.tier === DriverTier.SILVER);
      expect(silverTier).toBeDefined();
      expect(silverTier?.drivers).toBe(0);
      expect(silverTier?.averageRating).toBe(0);
    });
  });
});
