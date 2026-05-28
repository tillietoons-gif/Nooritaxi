import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PushModule } from '../push/push.module';
import { SuperAppController } from './super-app.controller';
import { SuperAppService } from './super-app.service';

@Module({
  imports: [PrismaModule, PushModule],
  controllers: [SuperAppController],
  providers: [SuperAppService],
})
export class SuperAppModule {}
