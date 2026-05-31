import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { PushModule } from '../push/push.module';
import { WalletModule } from '../wallet/wallet.module';
import { DispatchModule } from '../dispatch/dispatch.module';

@Module({
  imports: [PushModule, WalletModule, DispatchModule],
  providers: [TripsService],
  controllers: [TripsController],
})
export class TripsModule {}
