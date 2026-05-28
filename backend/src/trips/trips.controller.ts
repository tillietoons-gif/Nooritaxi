import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TripsService } from './trips.service';

@Controller('trips')
export class TripsController {
  constructor(private tripsService: TripsService) {}

  @Post()
  create(@Body() body: any) {
    return this.tripsService.create(body);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.tripsService.findByUserId(userId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.tripsService.updateStatus(id, status);
  }
}
