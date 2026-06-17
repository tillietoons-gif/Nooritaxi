import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryStatus } from '@prisma/client';
import { LogisticsService } from './logistics.service';
import { PrismaService } from '../prisma.service';
import { DispatchService } from '../dispatch/dispatch.service';

describe('LogisticsService', () => {
  let service: LogisticsService;
  let prisma: {
    delivery: { findUnique: jest.Mock; update: jest.Mock };
    auditLog: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      delivery: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogisticsService,
        { provide: PrismaService, useValue: prisma },
        { provide: DispatchService, useValue: { findNearestOnlineDriver: jest.fn() } },
      ],
    }).compile();

    service = module.get<LogisticsService>(LogisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('applies deliveredAt when an in-transit delivery is completed', async () => {
    prisma.delivery.findUnique.mockResolvedValue({
      id: 'delivery-1',
      status: DeliveryStatus.IN_TRANSIT,
    });
    prisma.delivery.update.mockImplementation(async ({ data }: any) => ({
      id: 'delivery-1',
      status: data.status,
      deliveredAt: data.deliveredAt,
    }));

    const result = await service.updateDelivery('delivery-1', {
      status: DeliveryStatus.DELIVERED,
      actorId: 'driver-1',
    });

    expect(prisma.delivery.update).toHaveBeenCalledWith({
      where: { id: 'delivery-1' },
      data: expect.objectContaining({
        status: DeliveryStatus.DELIVERED,
        deliveredAt: expect.any(Date),
      }),
      include: { order: true, sender: true, driver: true, vehicle: true },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'delivery-1',
        status: DeliveryStatus.DELIVERED,
        deliveredAt: expect.any(Date),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DELIVERY_UPDATED',
        entityType: 'Delivery',
        entityId: 'delivery-1',
        actorId: 'driver-1',
      }),
    });
  });

  it('rejects skipped delivery lifecycle transitions', async () => {
    prisma.delivery.findUnique.mockResolvedValue({
      id: 'delivery-1',
      status: DeliveryStatus.ASSIGNED,
    });

    await expect(
      service.updateDelivery('delivery-1', {
        status: DeliveryStatus.DELIVERED,
        actorId: 'driver-1',
      }),
    ).rejects.toThrow(
      'Invalid delivery status transition from ASSIGNED to DELIVERED',
    );

    expect(prisma.delivery.update).not.toHaveBeenCalled();
  });
});