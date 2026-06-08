import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { Driver, DriverTier } from '@prisma/client';

@Injectable()
export class DriverTierService {
  private readonly logger = new Logger(DriverTierService.name);
  private readonly defaultTierConfigs = [
    { tier: DriverTier.BRONZE, minTrips: 0, minRating: 0 },
    { tier: DriverTier.SILVER, minTrips: 100, minRating: 4.5 },
    { tier: DriverTier.GOLD, minTrips: 500, minRating: 4.7 },
    { tier: DriverTier.PLATINUM, minTrips: 1000, minRating: 4.85 },
  ];

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleUpdateDriverTiers() {
    this.logger.log('Starting daily driver tier evaluation job...');

    try {
      const tierConfigs = await this.prisma.driverTierConfig.findMany({
        orderBy: {
          minTrips: 'desc',
        },
      });

      if (tierConfigs.length === 0) {
        this.logger.warn(
          'No driver tier configurations found in the database. Aborting job.',
        );
        return;
      }

      const drivers = await this.prisma.driver.findMany({
        select: {
          id: true,
          completedTrips: true,
          ratingAverage: true,
          tier: true,
        },
      });

      const updatePromises: Promise<Driver>[] = [];

      for (const driver of drivers) {
        let newTier: DriverTier = DriverTier.BRONZE;

        for (const config of tierConfigs) {
          if (
            driver.completedTrips >= config.minTrips &&
            driver.ratingAverage >= config.minRating
          ) {
            newTier = config.tier;
            break;
          }
        }

        if (driver.tier !== newTier) {
          this.logger.log(
            `Driver ${driver.id} tier changed: ${driver.tier} -> ${newTier}`,
          );
          const updatePromise = this.prisma.driver.update({
            where: { id: driver.id },
            data: { tier: newTier },
          });
          updatePromises.push(updatePromise);
        }
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        this.logger.log(
          `Successfully updated tiers for ${updatePromises.length} drivers.`,
        );
      } else {
        this.logger.log('No driver tiers required an update.');
      }

      this.logger.log('Driver tier evaluation job finished successfully.');
    } catch (error: any) {
      this.logger.error(
        'Failed to run driver tier evaluation job.',
        error.stack,
      );
    }
  }

  async getAdminSummary() {
    const [totalDrivers, averages, atRisk, tierDistribution, tierConfigs] =
      await Promise.all([
        this.prisma.driver.count(),
        this.prisma.driver.aggregate({
          _avg: {
            ratingAverage: true,
            completedTrips: true,
            completedDeliveries: true,
          },
        }),
        this.prisma.driver.count({
          where: { ratingAverage: { lt: 4.5 } },
        }),
        this.prisma.driver.groupBy({
          by: ['tier'],
          _count: { tier: true },
          _avg: { ratingAverage: true, completedTrips: true },
          _sum: { completedTrips: true, completedDeliveries: true },
          orderBy: { tier: 'asc' },
        }),
        this.prisma.driverTierConfig.findMany({
          orderBy: [{ minTrips: 'asc' }, { minRating: 'asc' }],
        }),
      ]);

    const configByTier = new Map(
      (tierConfigs.length ? tierConfigs : this.defaultTierConfigs).map(
        (config) => [config.tier, config],
      ),
    );
    const distributionByTier = new Map(
      tierDistribution.map((tier) => [tier.tier, tier]),
    );

    const tiers = Object.values(DriverTier).map((tier) => {
      const distribution = distributionByTier.get(tier);
      const config = configByTier.get(tier);
      return {
        tier,
        drivers: distribution?._count.tier ?? 0,
        minTrips: config?.minTrips ?? 0,
        minRating: config?.minRating ?? 0,
        averageRating: distribution?._avg.ratingAverage ?? 0,
        averageTrips: distribution?._avg.completedTrips ?? 0,
        completedTrips: distribution?._sum.completedTrips ?? 0,
        completedDeliveries: distribution?._sum.completedDeliveries ?? 0,
      };
    });

    return {
      totals: {
        totalDrivers,
        averageRating: averages._avg.ratingAverage ?? 0,
        averageCompletedTrips: averages._avg.completedTrips ?? 0,
        averageCompletedDeliveries: averages._avg.completedDeliveries ?? 0,
        atRiskDrivers: atRisk,
      },
      configSource: tierConfigs.length ? 'database' : 'defaults',
      tiers,
    };
  }
}
