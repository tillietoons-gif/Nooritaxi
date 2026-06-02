import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { FleetsService } from './fleets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/fleets')
@UseGuards(JwtAuthGuard)
export class FleetsController {
  constructor(private readonly fleetsService: FleetsService) {}

  @Get()
  findAll() {
    return this.fleetsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fleetsService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.fleetsService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.fleetsService.update(id, data);
  }

  @Post(':id/drivers')
  addDriver(@Param('id') id: string, @Body('driverId') driverId: string) {
    return this.fleetsService.addDriver(id, driverId);
  }

  @Post(':id/vehicles')
  addVehicle(@Param('id') id: string, @Body() data: any) {
    return this.fleetsService.addVehicle(id, data);
  }

  @Get(':id/earnings')
  getEarnings(@Param('id') id: string) {
    return this.fleetsService.getEarnings(id);
  }

  @Get(':id/analytics')
  getAnalytics(@Param('id') id: string) {
    return this.fleetsService.getAnalytics(id);
  }

  @Post(':id/payouts')
  requestPayout(@Param('id') id: string, @Body() data: any) {
    return this.fleetsService.requestPayout(id, data);
  }
}
