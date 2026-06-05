import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { FoodModule } from '../food/food.module';
import { LogisticsModule } from '../logistics/logistics.module';

@Module({
  imports: [FoodModule, LogisticsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
