import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('admin/marketing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('promotions')
  @RequirePermission('marketing.view')
  getPromotions() {
    return this.marketingService.getPromotions();
  }

  @Post('promotions')
  @RequirePermission('marketing.edit')
  createPromotion(@Body() data: any) {
    return this.marketingService.createPromotion(data);
  }

  @Put('promotions/:id/status')
  @RequirePermission('marketing.edit')
  togglePromotionStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.marketingService.togglePromotionStatus(id, isActive);
  }

  @Get('promotions/:id/redemptions')
  @RequirePermission('marketing.view')
  getPromotionRedemptions(@Param('id') id: string) {
    return this.marketingService.getPromotionRedemptions(id);
  }

  @Get('campaigns')
  @RequirePermission('marketing.view')
  getCampaigns() {
    return this.marketingService.getCampaigns();
  }

  @Post('campaigns')
  @RequirePermission('marketing.edit')
  createCampaign(@Request() req, @Body() data: any) {
    data.adminId = req.user.userId;
    return this.marketingService.createCampaign(data);
  }
}
