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
import { SurgeService } from './surge.service';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('surge-zones')
export class SurgeController {
  constructor(private readonly surgeService: SurgeService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listZones(@Query('activeOnly') activeOnly?: string) {
    if (activeOnly === 'true') {
      return this.surgeService.getActiveZones();
    }
    return this.surgeService.getAllZones();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createZone(@Body() body: any) {
    return this.surgeService.createZone({
      name: body.name,
      multiplier: body.multiplier,
      radiusKm: body.radiusKm,
      centerLat: body.centerLat,
      centerLng: body.centerLng,
      isActive: body.isActive ?? true,
      activeFrom: new Date(body.activeFrom),
      activeUntil: new Date(body.activeUntil),
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateZone(
    @Param('id') id: string,
    @Body() body: { isActive: boolean; activeUntil?: string },
  ) {
    return this.surgeService.updateZoneStatus(
      id,
      body.isActive,
      body.activeUntil ? new Date(body.activeUntil) : undefined,
    );
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deactivateZone(@Param('id') id: string) {
    return this.surgeService.updateZoneStatus(id, false);
  }

  // Public endpoint for apps to check current surge
  @Get('check')
  checkSurge(@Query('lat') lat: string, @Query('lng') lng: string) {
    if (!lat || !lng) return { multiplier: 1.0 };
    return this.surgeService
      .getSurgeMultiplier(Number(lat), Number(lng))
      .then((multiplier) => ({ multiplier }));
  }
}
