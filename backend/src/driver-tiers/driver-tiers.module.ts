import { Module } from '@nestjs/common';
import { DriverTierService } from './driver-tier.service';
import { PrismaService } from '../prisma.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [DriverTierService, PrismaService],
})
export class DriverTiersModule {}
