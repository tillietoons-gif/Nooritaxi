import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('admin-tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPPORT)
export class AdminTrackingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('online-drivers')
  async getOnlineDrivers() {
    const activeDrivers = await this.prisma.driver.findMany({
      where: {
        status: { in: ['ONLINE', 'BUSY'] },
        currentLat: { not: null },
        currentLng: { not: null },
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    return activeDrivers.map(d => ({
      id: d.userId,
      lat: d.currentLat,
      lng: d.currentLng,
      name: d.user?.name || 'Unknown',
      status: d.status,
    }));
  }
}
