import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PushModule } from '../push/push.module';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';

@Module({
  imports: [ConfigModule, PushModule],
  controllers: [SafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}
