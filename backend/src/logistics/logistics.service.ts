import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DispatchService } from '../dispatch/dispatch.service';

@Injectable()
export class LogisticsService {
  constructor(
    private prisma: PrismaService,
    private dispatch: DispatchService,
  ) {}

  async createDelivery(data: any) {
    const driver = data.driverId
      ? null
      : await this.dispatch.findNearestOnlineDriver(
          data.pickupLat ?? 0,
          data.pickupLng ?? 0,
          10,
        );

    const delivery = await this.prisma.delivery.create({
      data: {
        ...data,
        driverId: data.driverId ?? driver?.userId,
        vehicleId: data.vehicleId ?? driver?.vehicles[0]?.id,
        fee: data.fee ?? 100,
        status: data.driverId || driver ? 'ASSIGNED' : 'REQUESTED',
      },
      include: { order: true, driver: true, vehicle: true },
    });

    await this.audit(
      'DELIVERY_CREATED',
      'Delivery',
      delivery.id,
      data.senderId,
      delivery,
    );
    return delivery;
  }

  listDeliveries(userId?: string, page = 1, limit = 25) {
    return this.prisma.delivery.findMany({
      where: userId ? { OR: [{ senderId: userId }, { driverId: userId }] } : {},
      include: { order: true, sender: true, driver: true, vehicle: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDelivery(id: string, data: any) {
    const before = await this.prisma.delivery.findUnique({ where: { id } });
    const delivery = await this.prisma.delivery.update({ where: { id }, data });
    await this.audit(
      'DELIVERY_UPDATED',
      'Delivery',
      id,
      data.actorId,
      delivery,
      before,
    );
    return delivery;
  }

  private async audit(
    action: string,
    entityType: string,
    entityId?: string,
    actorId?: string,
    after?: any,
    before?: any,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        actorId,
        before: before ?? undefined,
        after: after ?? undefined,
      },
    });
  }
}
