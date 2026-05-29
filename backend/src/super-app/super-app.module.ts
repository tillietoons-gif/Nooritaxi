import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PushModule } from '../push/push.module';
import { WalletModule } from '../wallet/wallet.module';
import { SuperAppController } from './super-app.controller';
import { SuperAppService } from './super-app.service';
import { SurgeController } from './surge.controller';

@Module({
  imports: [PrismaModule, PushModule, WalletModule],
  controllers: [SuperAppController, SurgeController],
  providers: [SuperAppService],
  exports: [SuperAppService],
})
export class SuperAppModule {}
