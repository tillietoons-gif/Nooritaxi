import { Module } from '@nestjs/common';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';
import { WalletModule } from '../wallet/wallet.module';
import { DispatchModule } from '../dispatch/dispatch.module';

@Module({
  imports: [WalletModule, DispatchModule],
  controllers: [FoodController],
  providers: [FoodService]
})
export class FoodModule {}
