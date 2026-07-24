import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FleetsService } from './fleets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('admin/fleets')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN)
export class FleetsController {
  constructor(private readonly fleetsService: FleetsService) {}

  @Get()
  @RequirePermission('fleets.view')
  findAll() {
    return this.fleetsService.findAll();
  }

  @Get(':id')
  @RequirePermission('fleets.view')
  findOne(@Param('id') id: string) {
    return this.fleetsService.findOne(id);
  }

  @Post()
  @RequirePermission('fleets.edit')
  create(@Body() data: any) {
    return this.fleetsService.create(data);
  }

  @Patch(':id')
  @RequirePermission('fleets.edit')
  update(@Param('id') id: string, @Body() data: any) {
    return this.fleetsService.update(id, data);
  }

  @Post(':id/drivers')
  @RequirePermission('fleets.edit')
  addDriver(@Param('id') id: string, @Body('driverId') driverId: string) {
    return this.fleetsService.addDriver(id, driverId);
  }

  @Post(':id/vehicles')
  @RequirePermission('fleets.edit')
  addVehicle(@Param('id') id: string, @Body() data: any) {
    return this.fleetsService.addVehicle(id, data);
  }

  @Get(':id/earnings')
  @RequirePermission('fleets.view')
  getEarnings(@Param('id') id: string) {
    return this.fleetsService.getEarnings(id);
  }

  @Get(':id/analytics')
  @RequirePermission('fleets.view')
  getAnalytics(@Param('id') id: string) {
    return this.fleetsService.getAnalytics(id);
  }

  @Post(':id/payouts')
  @RequirePermission('fleets.payouts')
  requestPayout(@Param('id') id: string, @Body() data: any) {
    return this.fleetsService.requestPayout(id, data);
  }
}
