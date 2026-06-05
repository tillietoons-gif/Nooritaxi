import { Module } from '@nestjs/common';
import { DriverTierService } from './driver-tier.service';
import { PrismaService } from '../prisma.service';
import { ScheduleModule } from '@nestjs/schedule';
import { DriverTiersController } from './driver-tiers.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [DriverTiersController],
  providers: [DriverTierService, PrismaService],
})
export class DriverTiersModule {}
