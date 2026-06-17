import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DocumentStatus, DocumentType, UserStatus } from '@prisma/client';
import { SuperAppService } from './super-app.service';
import { PrismaService } from '../prisma.service';
import { PushService } from '../push/push.service';
import { WalletService } from '../wallet/wallet.service';

describe('SuperAppService', () => {
  let service: SuperAppService;
  let prisma: {
    driver: { upsert: jest.Mock };
    driverDocument: { findMany: jest.Mock };
    user: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      driver: { upsert: jest.fn() },
      driverDocument: { findMany: jest.fn() },
      user: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAppService,
        { provide: PrismaService, useValue: prisma },
        { provide: PushService, useValue: {} },
        { provide: WalletService, useValue: {} },
      ],
    }).compile();

    service = module.get(SuperAppService);
  });

  it('rejects online status before phone verification and required KYC', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'driver-1',
      status: UserStatus.PENDING_VERIFICATION,
      isVerified: false,
    });

    await expect(
      service.updateMyDriverStatus('driver-1', { status: 'ONLINE' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.driver.upsert).not.toHaveBeenCalled();
  });

  it('allows online status after phone verification and required KYC', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'driver-1',
      status: UserStatus.ACTIVE,
      isVerified: true,
    });
    prisma.driverDocument.findMany.mockResolvedValue([
      { type: DocumentType.ID_CARD },
      { type: DocumentType.DRIVERS_LICENSE },
      { type: DocumentType.VEHICLE_REGISTRATION },
      { type: DocumentType.INSURANCE },
    ]);
    prisma.driver.upsert.mockResolvedValue({
      userId: 'driver-1',
      status: 'ONLINE',
    });

    await expect(
      service.updateMyDriverStatus('driver-1', { status: 'ONLINE' }),
    ).resolves.toEqual(expect.objectContaining({ status: 'ONLINE' }));
    expect(prisma.driverDocument.findMany).toHaveBeenCalledWith({
      where: {
        driverId: 'driver-1',
        type: {
          in: [
            DocumentType.ID_CARD,
            DocumentType.DRIVERS_LICENSE,
            DocumentType.VEHICLE_REGISTRATION,
            DocumentType.INSURANCE,
          ],
        },
        status: DocumentStatus.VERIFIED,
      },
      select: { type: true },
    });
  });
});
