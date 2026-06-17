import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentMethod, UserRole } from '@prisma/client';
import { FoodService } from './food.service';
import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { DispatchService } from '../dispatch/dispatch.service';

describe('FoodService', () => {
  let service: FoodService;
  let prisma: {
    $transaction: jest.Mock;
    auditLog: { create: jest.Mock };
    menuItem: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    restaurant: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      auditLog: { create: jest.fn() },
      menuItem: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      restaurant: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodService,
        { provide: PrismaService, useValue: prisma },
        { provide: WalletService, useValue: { transfer: jest.fn() } },
        {
          provide: DispatchService,
          useValue: { findNearestOnlineDriver: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<FoodService>(FoodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('prevents merchants from managing another restaurant menu', async () => {
    prisma.restaurant.findUnique.mockResolvedValue({
      id: 'restaurant-1',
      ownerId: 'merchant-owner',
    });

    await expect(
      service.addMenuItem(
        'restaurant-1',
        { name: 'Kabuli', price: 350 },
        { id: 'other-merchant', role: UserRole.MERCHANT },
      ),
    ).rejects.toThrow('Cannot manage another merchant restaurant');

    expect(prisma.menuItem.create).not.toHaveBeenCalled();
  });

  it('applies deliveredAt when an order is delivered', async () => {
    const tx = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          status: OrderStatus.OUT_FOR_DELIVERY,
          restaurant: {
            lat: 34.5,
            lng: 69.2,
            address: 'Kabul',
            ownerId: 'merchant-1',
          },
        }),
        update: jest.fn().mockImplementation(async ({ data }: any) => ({
          id: 'order-1',
          status: data.status,
          deliveredAt: data.deliveredAt,
          paymentMethod: PaymentMethod.CASH,
          restaurant: {
            ownerId: 'merchant-1',
            lat: 34.5,
            lng: 69.2,
            address: 'Kabul',
          },
        })),
      },
      delivery: { create: jest.fn() },
    };

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback(tx),
    );

    const result = await service.updateOrder('order-1', {
      status: OrderStatus.DELIVERED,
      actorId: 'driver-1',
    });

    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: expect.objectContaining({
        status: OrderStatus.DELIVERED,
        deliveredAt: expect.any(Date),
      }),
      include: { delivery: true, items: true, restaurant: true },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.DELIVERED,
        deliveredAt: expect.any(Date),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'ORDER_UPDATED',
        entityType: 'Order',
        entityId: 'order-1',
        actorId: 'driver-1',
      }),
    });
  });

  it('rejects skipped order lifecycle transitions', async () => {
    const tx = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          status: OrderStatus.PLACED,
          restaurant: {
            lat: 34.5,
            lng: 69.2,
            address: 'Kabul',
            ownerId: 'merchant-1',
          },
        }),
        update: jest.fn(),
      },
      delivery: { create: jest.fn() },
    };

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback(tx),
    );

    await expect(
      service.updateOrder('order-1', {
        status: OrderStatus.DELIVERED,
        actorId: 'driver-1',
      }),
    ).rejects.toThrow(
      'Invalid order status transition from PLACED to DELIVERED',
    );

    expect(tx.order.update).not.toHaveBeenCalled();
  });
});
