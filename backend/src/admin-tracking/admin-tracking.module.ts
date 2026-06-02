import { Module } from '@nestjs/common';
import { AdminTrackingController } from './admin-tracking.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AdminTrackingController],
  providers: [PrismaService],
})
export class AdminTrackingModule {}
