import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { FoodService } from '../food/food.service';
import { LogisticsService } from '../logistics/logistics.service';

type ListArgs = {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
};

const clampLimit = (limit?: number) =>
  Math.min(Math.max(Number.isFinite(limit) && limit ? limit : 25, 1), 100);
const clampPage = (page?: number) =>
  Math.max(Number.isFinite(page) && page ? page : 1, 1);

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private food: FoodService,
    private logistics: LogisticsService,
  ) {}

  // ------- Trips -------
  async listTrips({ status, q, page, from, to, limit }: ListArgs) {
    const safeLimit = clampLimit(limit);
    const safePage = clampPage(page);

    const where: Prisma.TripWhereInput = {};
    if (status) where.status = status as any;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { pickupLocation: { contains: q, mode: 'insensitive' } },
        { dropoffLocation: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q } } },
        { driver: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          driver: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { plateNumber: true, make: true, model: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.trip.count({ where }),
    ]);

    return { items, total, page: safePage, limit: safeLimit };
  }

  getTrip(id: string) {
    return this.prisma.trip.findUnique({
      where: { id },
      include: {
        customer: true,
        driver: true,
        vehicle: true,
        reviews: true,
        transactions: true,
      },
    });
  }

  async updateTripStatus(id: string, status: string, actorId?: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundException('Trip not found');
    const updated = await this.prisma.trip.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });
    await this.audit(
      'ADMIN_TRIP_STATUS_UPDATED',
      'Trip',
      id,
      actorId,
      { status },
      { status: trip.status },
    );
    return updated;
  }

  // ------- Orders -------
  async listOrders({ status, q, page, from, to, limit }: ListArgs) {
    const safeLimit = clampLimit(limit);
    const safePage = clampPage(page);

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status as any;
    if (from || to) {
      where.placedAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { deliveryAddress: { contains: q, mode: 'insensitive' } },
        { restaurant: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          restaurant: { select: { id: true, name: true } },
          items: { include: { menuItem: { select: { name: true } } } },
          delivery: { select: { id: true, status: true, driverId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page: safePage, limit: safeLimit };
  }

  async updateOrderStatus(id: string, status: string, actorId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    const updated = await this.food.updateOrder(id, {
      status,
      actorId,
    });
    await this.audit(
      'ADMIN_ORDER_STATUS_UPDATED',
      'Order',
      id,
      actorId,
      { status },
      { status: order.status },
    );
    return updated;
  }

  async updateDeliveryStatus(id: string, status: string, actorId?: string) {
    const updated = await this.logistics.updateDelivery(id, {
      status,
      actorId,
      ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
    });
    await this.audit('ADMIN_DELIVERY_STATUS_UPDATED', 'Delivery', id, actorId, {
      status,
    });
    return updated;
  }

  // ------- Deliveries -------
  async listDeliveries({ status, q, page, from, to, limit }: ListArgs) {
    const safeLimit = clampLimit(limit);
    const safePage = clampPage(page);

    const where: Prisma.DeliveryWhereInput = {};
    if (status) where.status = status as any;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { pickupAddress: { contains: q, mode: 'insensitive' } },
        { dropoffAddress: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        include: {
          driver: { select: { id: true, name: true, phone: true } },
          sender: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, plateNumber: true, type: true } },
          order: { select: { id: true, restaurantId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.delivery.count({ where }),
    ]);
    return { items, total, page: safePage, limit: safeLimit };
  }

  // ------- Reviews -------
  async listReviews({ status, q, page, from, to, limit }: ListArgs) {
    const safeLimit = clampLimit(limit);
    const safePage = clampPage(page);

    const where: Prisma.ReviewWhereInput = {};
    if (status === 'VISIBLE') where.isVisible = true;
    if (status === 'HIDDEN') where.isVisible = false;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { comment: { contains: q, mode: 'insensitive' } },
        { author: { name: { contains: q, mode: 'insensitive' } } },
        { author: { phone: { contains: q } } },
        { restaurant: { name: { contains: q, mode: 'insensitive' } } },
        { trip: { id: { contains: q, mode: 'insensitive' } } },
        { order: { id: { contains: q, mode: 'insensitive' } } },
        { delivery: { id: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, phone: true } },
          restaurant: { select: { id: true, name: true } },
          trip: { select: { id: true } },
          order: { select: { id: true } },
          delivery: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.review.count({ where }),
    ]);

    const targetUserIds = [
      ...new Set(items.map((review) => review.targetUserId).filter(Boolean)),
    ] as string[];
    const targetUsers = targetUserIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: targetUserIds } },
          select: { id: true, name: true, phone: true },
        })
      : [];
    const targetUserMap = new Map(targetUsers.map((user) => [user.id, user]));

    return {
      items: items.map((review) => ({
        ...review,
        targetUser: review.targetUserId
          ? (targetUserMap.get(review.targetUserId) ?? null)
          : null,
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async updateReviewVisibility(
    id: string,
    isVisible: boolean,
    actorId?: string,
  ) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    const updated = await this.prisma.review.update({
      where: { id },
      data: { isVisible },
    });

    await this.audit(
      'ADMIN_REVIEW_VISIBILITY_UPDATED',
      'Review',
      id,
      actorId,
      { isVisible },
      { isVisible: review.isVisible },
    );

    return updated;
  }

  // ------- Drivers -------
  async listDrivers({ status, q, page, limit }: ListArgs) {
    const safeLimit = clampLimit(limit);
    const safePage = clampPage(page);

    const where: Prisma.DriverWhereInput = {};
    if (status) where.status = status as any;
    if (q) {
      where.OR = [
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { phone: { contains: q } } },
        { licenseNumber: { contains: q, mode: 'insensitive' } },
        { nationalIdNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.driver.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              role: true,
              status: true,
            },
          },
          vehicles: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.driver.count({ where }),
    ]);
    return { items, total, page: safePage, limit: safeLimit };
  }

  async getDriver(id: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
            status: true,
            isVerified: true,
            createdAt: true,
          },
        },
        vehicles: true,
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async getDriverOperations(id: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      select: { id: true, userId: true },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    const [
      trips,
      deliveries,
      wallets,
      settlements,
      reviews,
      incidents,
      fraudScore,
      fraudCases,
      fraudAlerts,
      audits,
    ] = await Promise.all([
      this.prisma.trip.findMany({
        where: { driverId: driver.userId },
        select: {
          id: true,
          status: true,
          pickupLocation: true,
          dropoffLocation: true,
          fare: true,
          paymentMethod: true,
          requestedAt: true,
          completedAt: true,
          cancelledAt: true,
          createdAt: true,
          customer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.delivery.findMany({
        where: { driverId: driver.userId },
        select: {
          id: true,
          status: true,
          pickupAddress: true,
          dropoffAddress: true,
          fee: true,
          requestedAt: true,
          deliveredAt: true,
          createdAt: true,
          sender: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.wallet.findMany({
        where: { userId: driver.userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.settlement.findMany({
        where: { userId: driver.userId },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      this.prisma.review.findMany({
        where: {
          OR: [
            { targetUserId: driver.userId },
            { trip: { driverId: driver.userId } },
            { delivery: { driverId: driver.userId } },
          ],
        },
        include: {
          author: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.incident.findMany({
        where: {
          OR: [{ driverId: driver.id }, { userId: driver.userId }],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.fraudScore.findFirst({
        where: { OR: [{ driverId: driver.id }, { userId: driver.userId }] },
      }),
      this.prisma.fraudCase.findMany({
        where: {
          OR: [{ targetDriverId: driver.id }, { targetUserId: driver.userId }],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.fraudAlert.findMany({
        where: {
          OR: [{ driverId: driver.id }, { userId: driver.userId }],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.auditLog.findMany({
        where: {
          OR: [
            { entityType: 'Driver', entityId: driver.id },
            { entityType: 'User', entityId: driver.userId },
            { actorId: driver.userId },
          ],
        },
        include: { actor: { select: { id: true, name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    const completedTrips = trips.filter((trip) => trip.status === 'COMPLETED');
    const completedDeliveries = deliveries.filter(
      (delivery) => delivery.status === 'DELIVERED',
    );
    const totalTripFare = completedTrips.reduce(
      (sum, trip) => sum + Number(trip.fare ?? 0),
      0,
    );
    const totalDeliveryFees = completedDeliveries.reduce(
      (sum, delivery) => sum + Number(delivery.fee ?? 0),
      0,
    );

    return {
      summary: {
        completedTrips: completedTrips.length,
        completedDeliveries: completedDeliveries.length,
        totalTripFare,
        totalDeliveryFees,
        openIncidents: incidents.filter(
          (incident) => incident.status !== 'CLOSED',
        ).length,
        unresolvedFraudAlerts: fraudAlerts.filter((alert) => !alert.isResolved)
          .length,
      },
      trips,
      deliveries,
      wallets,
      settlements,
      reviews,
      incidents,
      fraud: {
        score: fraudScore,
        cases: fraudCases,
        alerts: fraudAlerts,
      },
      audits,
    };
  }

  async updateDriverStatus(id: string, status: string, actorId?: string) {
    if (!['OFFLINE', 'ONLINE', 'BUSY', 'SUSPENDED'].includes(status)) {
      throw new BadRequestException('Invalid driver status');
    }

    const driver = await this.prisma.driver.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      include: { user: true },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextUserStatus = status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
      await tx.user.update({
        where: { id: driver.userId },
        data: {
          status: nextUserStatus as any,
          ...(status !== 'SUSPENDED' ? { isVerified: true } : {}),
        },
      });
      return tx.driver.update({
        where: { id: driver.id },
        data: { status: status as any },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              role: true,
              status: true,
              isVerified: true,
              createdAt: true,
            },
          },
          vehicles: true,
          documents: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    await this.audit(
      'ADMIN_DRIVER_STATUS_UPDATED',
      'Driver',
      driver.id,
      actorId,
      { status },
      { status: driver.status, userStatus: driver.user.status },
    );
    return updated;
  }

  async updateDriverProfile(id: string, body: any, actorId?: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      include: { vehicles: { take: 1 }, user: true },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    const tier = body?.tier;
    if (
      tier &&
      !['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(String(tier))
    ) {
      throw new BadRequestException('Invalid driver tier');
    }

    const vehicleType = body?.vehicleType;
    if (
      vehicleType &&
      !['CAR', 'MOTORBIKE', 'RICKSHAW', 'VAN', 'TRUCK', 'BICYCLE'].includes(
        String(vehicleType),
      )
    ) {
      throw new BadRequestException('Invalid vehicle type');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: driver.userId },
        data: {
          ...(typeof body?.name === 'string' ? { name: body.name.trim() } : {}),
          ...(typeof body?.email === 'string'
            ? { email: body.email.trim() || null }
            : {}),
        },
      });

      await tx.driver.update({
        where: { id: driver.id },
        data: {
          ...(typeof body?.licenseNumber === 'string'
            ? { licenseNumber: body.licenseNumber.trim() || null }
            : {}),
          ...(typeof body?.nationalIdNumber === 'string'
            ? { nationalIdNumber: body.nationalIdNumber.trim() || null }
            : {}),
          ...(tier ? { tier: tier } : {}),
          ...(typeof body?.acceptsCash === 'boolean'
            ? { acceptsCash: body.acceptsCash }
            : {}),
          ...(typeof body?.acceptsWallet === 'boolean'
            ? { acceptsWallet: body.acceptsWallet }
            : {}),
        },
      });

      const vehicleData = {
        ...(vehicleType ? { type: vehicleType } : {}),
        ...(typeof body?.vehicleMake === 'string'
          ? { make: body.vehicleMake.trim() || null }
          : {}),
        ...(typeof body?.vehicleModel === 'string'
          ? { model: body.vehicleModel.trim() || null }
          : {}),
        ...(typeof body?.vehicleColor === 'string'
          ? { color: body.vehicleColor.trim() || null }
          : {}),
        ...(typeof body?.vehiclePlateNumber === 'string'
          ? { plateNumber: body.vehiclePlateNumber.trim() }
          : {}),
      };

      if (Object.keys(vehicleData).length) {
        const existingVehicle = driver.vehicles[0];
        if (existingVehicle) {
          await tx.vehicle.update({
            where: { id: existingVehicle.id },
            data: vehicleData,
          });
        } else if (vehicleData.plateNumber && vehicleData.type) {
          await tx.vehicle.create({
            data: {
              driverId: driver.id,
              type: vehicleData.type,
              plateNumber: vehicleData.plateNumber,
              make: vehicleData.make,
              model: vehicleData.model,
              color: vehicleData.color,
            },
          });
        }
      }

      return tx.driver.findUniqueOrThrow({
        where: { id: driver.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              role: true,
              status: true,
              isVerified: true,
              createdAt: true,
            },
          },
          vehicles: true,
          documents: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    await this.audit(
      'ADMIN_DRIVER_PROFILE_UPDATED',
      'Driver',
      driver.id,
      actorId,
      body,
    );
    return updated;
  }

  async listDriverDocuments(driverId: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { OR: [{ id: driverId }, { userId: driverId }] },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return this.prisma.driverDocument.findMany({
      where: { driverId: driver.userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDocumentStatus(
    driverId: string,
    docId: string,
    status: string,
    actorId?: string,
  ) {
    const doc = await this.prisma.driverDocument.findUnique({
      where: { id: docId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status))
      throw new BadRequestException('Invalid document status');
    const updated = await this.prisma.driverDocument.update({
      where: { id: docId },
      data: {
        status: status as any,
        verifiedBy: actorId,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
      },
    });
    if (status === 'VERIFIED') {
      const remainingPending = await this.prisma.driverDocument.count({
        where: { driverId: doc.driverId, status: 'PENDING' as any },
      });
      if (remainingPending === 0) {
        await this.prisma.user.update({
          where: { id: doc.driverId },
          data: { isVerified: true, status: 'ACTIVE' as any },
        });
      }
    }
    await this.audit(
      'KYC_DOCUMENT_REVIEWED',
      'DriverDocument',
      docId,
      actorId,
      { status },
      { status: doc.status },
    );
    return updated;
  }

  // ------- Users -------
  async listUsers({
    status,
    q,
    page,
    limit,
    role,
  }: ListArgs & { role?: string }) {
    const safeLimit = clampLimit(limit);
    const safePage = clampPage(page);

    const where: Prisma.UserWhereInput = {};
    if (status) where.status = status as any;
    if (role) where.role = role as any;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
        {
          adminRoles: {
            some: {
              role: { name: { contains: q, mode: 'insensitive' } },
            },
          },
        },
        {
          adminRoles: {
            some: {
              cityScope: { contains: q, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          adminRoles: {
            select: {
              cityScope: true,
              role: {
                select: {
                  id: true,
                  name: true,
                  isSystem: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page: safePage, limit: safeLimit };
  }

  async updateUserStatus(id: string, status: string, actorId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (
      !['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DELETED'].includes(
        status,
      )
    )
      throw new BadRequestException('Invalid user status');
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: status as any },
    });
    await this.audit(
      'ADMIN_USER_STATUS_UPDATED',
      'User',
      id,
      actorId,
      { status },
      { status: user.status },
    );
    return { id: updated.id, status: updated.status };
  }

  // ------- SOS -------
  listActiveSos() {
    return this.prisma.sosAlert.findMany({
      where: { status: 'ACTIVE' as any },
      include: {
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveSos(alertId: string, actorId?: string) {
    const alert = await this.prisma.sosAlert.findUnique({
      where: { id: alertId },
    });
    if (!alert) throw new NotFoundException('SOS alert not found');
    const resolved = await this.prisma.sosAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED' as any,
        resolvedAt: new Date(),
        resolvedBy: actorId,
      },
    });
    await this.audit('SOS_RESOLVED', 'SosAlert', alertId, actorId, {
      status: 'RESOLVED',
    });
    return resolved;
  }

  // ------- Audit -------
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
