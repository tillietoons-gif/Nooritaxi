import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TripsService } from './trips.service';
import { UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateTripStatusDto } from './dto';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private tripsService: TripsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RIDER)
  create(@Body() body: any) {
    return this.tripsService.create(body);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.tripsService.findByUserId(userId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER, UserRole.SUPPORT)
  updateStatus(@Param('id') id: string, @Body() body: UpdateTripStatusDto) {
    return this.tripsService.updateStatus(id, body.status);
  }
}
