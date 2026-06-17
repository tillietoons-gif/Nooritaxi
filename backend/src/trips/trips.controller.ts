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
import { TripsService } from './trips.service';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private tripsService: TripsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RIDER)
  createRide(@Body() body: any) {
    return this.tripsService.createRide(body);
  }

  @Get('estimate')
  estimateRide(
    @Query('distance') distance?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    return this.tripsService.getRideEstimate(
      Number(distance ?? 5),
      lat ? Number(lat) : undefined,
      lng ? Number(lng) : undefined,
    );
  }

  @Get()
  listRides(
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tripsService.listRides(
      userId,
      Number(page ?? 1),
      Number(limit ?? 25),
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  updateRide(@Param('id') id: string, @Body() body: any) {
    return this.tripsService.updateRide(id, body);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RIDER, UserRole.DRIVER)
  cancelRide(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() actor: any,
  ) {
    return this.tripsService.cancelRide(id, {
      actorId: actor?.id,
      actorRole: actor?.role,
      reason: body?.reason,
    });
  }
}
