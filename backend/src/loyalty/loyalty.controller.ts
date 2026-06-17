import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('admin/summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async getAdminSummary() {
    return this.loyaltyService.getAdminSummary();
  }

  @Get('me')
  async getMyLoyalty(@Req() req) {
    return this.loyaltyService.getUserLoyalty(req.user.id);
  }

  @Post('redeem')
  async redeemPoints(@Req() req, @Body() redeemPointsDto: RedeemPointsDto) {
    const userId = req.user.id;
    const { points, reason } = redeemPointsDto;

    return this.loyaltyService.redeemPoints(userId, points, reason);
  }
}
