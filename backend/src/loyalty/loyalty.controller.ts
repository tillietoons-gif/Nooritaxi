import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post('redeem')
  async redeemPoints(@Req() req, @Body() redeemPointsDto: RedeemPointsDto) {
    const userId = req.user.id;
    const { points, reason } = redeemPointsDto;

    return this.loyaltyService.redeemPoints(userId, points, reason);
  }
}
