import { Module } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { OperationsGateway } from './operations.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OperationsController],
  providers: [OperationsService, OperationsGateway],
  exports: [OperationsService],
})
export class OperationsModule {}
