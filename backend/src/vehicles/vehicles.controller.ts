import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('admin/vehicles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @RequirePermission('vehicles.view')
  getVehicles() {
    return this.vehiclesService.getVehicles();
  }

  @Get('inspections')
  @RequirePermission('vehicles.view')
  getInspections() {
    return this.vehiclesService.getInspections();
  }

  @Post('inspections')
  @RequirePermission('vehicles.edit')
  recordInspection(@Request() req, @Body() data: any) {
    data.adminId = req.user.userId;
    return this.vehiclesService.recordInspection(data);
  }
}
