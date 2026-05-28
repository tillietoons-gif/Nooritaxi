import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SuperAppController } from './super-app.controller';
import { SuperAppService } from './super-app.service';

@Module({
  imports: [PrismaModule],
  controllers: [SuperAppController],
  providers: [SuperAppService],
})
export class SuperAppModule {}
