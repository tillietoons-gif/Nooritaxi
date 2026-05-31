import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { LogisticsService } from './logistics.service';

@Controller('logistics')
export class LogisticsController {
  constructor(private logisticsService: LogisticsService) {}

  @Post('deliveries')
  @UseGuards(JwtAuthGuard)
  createDelivery(@Body() body: any) {
    return this.logisticsService.createDelivery(body);
  }

  @Get('deliveries')
  listDeliveries(
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.logisticsService.listDeliveries(
      userId,
      Number(page ?? 1),
      Number(limit ?? 25),
    );
  }

  @Patch('deliveries/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER, UserRole.SUPPORT)
  updateDelivery(@Param('id') id: string, @Body() body: any) {
    return this.logisticsService.updateDelivery(id, body);
  }
}
