import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin-tracking')
@UseGuards(JwtAuthGuard)
export class AdminTrackingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('online-drivers')
  async getOnlineDrivers() {
    const activeDrivers = await this.prisma.driver.findMany({
      where: {
        status: { in: ['ONLINE', 'BUSY'] },
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
      name: d.user?.name || 'Unknown'
    }));
  }
}
