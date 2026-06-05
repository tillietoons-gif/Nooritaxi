import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DriverTierService } from './driver-tier.service';

@Controller('driver-tiers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPPORT)
export class DriverTiersController {
  constructor(private readonly driverTierService: DriverTierService) {}

  @Get('admin/summary')
  getAdminSummary() {
    return this.driverTierService.getAdminSummary();
  }
}
