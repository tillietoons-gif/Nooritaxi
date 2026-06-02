import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AirportService } from './airport.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('admin/airports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AirportController {
  constructor(private readonly airportService: AirportService) {}

  @Get()
  @RequirePermission('airport.view')
  getAirports() {
    return this.airportService.getAirports();
  }

  @Post()
  @RequirePermission('airport.edit')
  createAirport(@Body() data: any) {
    return this.airportService.createAirport(data);
  }

  @Get(':id')
  @RequirePermission('airport.view')
  getAirportDetails(@Param('id') id: string) {
    return this.airportService.getAirportDetails(id);
  }

  @Get(':id/queue')
  @RequirePermission('airport.view')
  getQueue(@Param('id') id: string) {
    return this.airportService.getQueue(id);
  }

  @Post('queue/:queueId/assign')
  @RequirePermission('dispatch.override')
  assignDriver(@Param('queueId') queueId: string) {
    return this.airportService.assignDriver(queueId);
  }

  @Post('queue/:queueId/remove')
  @RequirePermission('driver.queue.manage')
  removeDriver(@Param('queueId') queueId: string) {
    return this.airportService.removeDriverFromQueue(queueId);
  }

  @Get(':id/flights')
  @RequirePermission('airport.view')
  getFlights(@Param('id') id: string) {
    return this.airportService.getFlights(id);
  }

  @Get(':id/analytics')
  @RequirePermission('airport.analytics')
  getAnalytics(@Param('id') id: string) {
    return this.airportService.getAnalytics(id);
  }
}
