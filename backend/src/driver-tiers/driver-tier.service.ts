import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { Driver, DriverTier } from '@prisma/client';

@Injectable()
export class DriverTierService {
  private readonly logger = new Logger(DriverTierService.name);

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
        this.logger.warn('No driver tier configurations found in the database. Aborting job.');
        return;
      }

      const drivers = await this.prisma.driver.findMany({
        select: { id: true, completedTrips: true, ratingAverage: true, tier: true },
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
          this.logger.log(`Driver ${driver.id} tier changed: ${driver.tier} -> ${newTier}`);
          const updatePromise = this.prisma.driver.update({
            where: { id: driver.id },
            data: { tier: newTier },
          });
          updatePromises.push(updatePromise);
        }
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        this.logger.log(`Successfully updated tiers for ${updatePromises.length} drivers.`);
      } else {
        this.logger.log('No driver tiers required an update.');
      }

      this.logger.log('Driver tier evaluation job finished successfully.');
    } catch (error: any) {
      this.logger.error('Failed to run driver tier evaluation job.', error.stack);
    }
  }
}
