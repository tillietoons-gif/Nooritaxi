import { Module } from '@nestjs/common';
import { AirportService } from './airport.service';
import { AirportController } from './airport.controller';
import { AirportGateway } from './airport.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AirportController],
  providers: [AirportService, AirportGateway],
  exports: [AirportService]
})
export class AirportModule {}
