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
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  constructor(private places: PlacesService) {}

  @Get()
  searchPlaces(
    @Query('q') q?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: string,
  ) {
    return this.places.searchPlaces(q, city, Number(limit ?? 10));
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  listAdminPlaces() {
    return this.places.listAdminPlaces();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createPlace(@Body() body: any, @CurrentUser() actor: any) {
    return this.places.createPlace({ ...body, createdById: actor?.id });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updatePlace(@Param('id') id: string, @Body() body: any) {
    return this.places.updatePlace(id, body);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deactivatePlace(@Param('id') id: string) {
    return this.places.deactivatePlace(id);
  }
}
