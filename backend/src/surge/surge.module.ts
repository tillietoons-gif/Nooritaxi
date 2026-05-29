import { Module } from '@nestjs/common';
import { SurgeController } from './surge.controller';
import { SurgeService } from './surge.service';

@Module({
  controllers: [SurgeController],
  providers: [SurgeService],
  exports: [SurgeService],
})
export class SurgeModule {}
