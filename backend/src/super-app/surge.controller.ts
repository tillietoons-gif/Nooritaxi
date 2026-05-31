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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma.service';

@Controller('surge-zones')
export class SurgeController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@Query('active') active?: string) {
    const now = new Date();
    const where =
      active === 'true'
        ? {
            isActive: true,
            activeFrom: { lte: now },
            activeUntil: { gte: now },
          }
        : {};
    return this.prisma.surgeZone.findMany({
      where,
      orderBy: { multiplier: 'desc' },
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() body: any) {
    return this.prisma.surgeZone.create({ data: body });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() body: any) {
    return this.prisma.surgeZone.update({ where: { id }, data: body });
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.prisma.surgeZone.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
