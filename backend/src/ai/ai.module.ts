import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
