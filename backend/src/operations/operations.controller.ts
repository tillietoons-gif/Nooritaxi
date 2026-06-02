import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('admin/operations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OperationsController {
  constructor(private readonly opsService: OperationsService) {}

  @Get('dashboard')
  @RequirePermission('operations.view')
  getDashboardMetrics() {
    return this.opsService.getDashboardMetrics();
  }

  @Get('map')
  @RequirePermission('operations.view')
  getLiveMapData() {
    return this.opsService.getLiveMapData();
  }

  @Get('incidents')
  @RequirePermission('operations.view')
  getIncidents() {
    return this.opsService.getIncidents();
  }

  @Get('incidents/:id')
  @RequirePermission('operations.view')
  getIncidentDetails(@Param('id') id: string) {
    return this.opsService.getIncidentDetails(id);
  }

  @Post('incidents')
  @RequirePermission('operations.edit')
  createIncident(@Body() data: any) {
    return this.opsService.createIncident(data);
  }

  @Put('incidents/:id')
  @RequirePermission('operations.edit')
  updateIncident(@Param('id') id: string, @Body() data: any) {
    return this.opsService.updateIncident(id, data);
  }

  @Get('sos')
  @RequirePermission('operations.view')
  getSosAlerts() {
    return this.opsService.getSosAlerts();
  }

  @Post('dispatch/manual')
  @RequirePermission('operations.edit')
  manualDispatch(@Request() req, @Body() data: { tripId: string, driverId: string }) {
    return this.opsService.manualDispatch(data.tripId, data.driverId, req.user.userId);
  }

  @Post('broadcast')
  @RequirePermission('operations.edit')
  sendBroadcast(@Request() req, @Body() data: any) {
    data.adminId = req.user.userId;
    return this.opsService.sendBroadcast(data);
  }
}
