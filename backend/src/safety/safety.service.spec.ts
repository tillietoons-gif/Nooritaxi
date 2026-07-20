import { Test, TestingModule } from '@nestjs/testing';
import { SafetyService } from './safety.service';
import { PrismaService } from '../prisma.service';
import { PushService } from '../push/push.service';
import { ConfigService } from '@nestjs/config';
import { SosStatus, UserRole } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('SafetyService', () => {
  let service: SafetyService;
  let prisma: {
    trustedContact: {
      findMany: jest.Mock;
      upsert: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    trip: {
      findFirst: jest.Mock;
    };
    sosAlert: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
    pushDevice: {
      findMany: jest.Mock;
    };
    auditLog: {
      create: jest.Mock;
    };
  };
  let push: {
    sendToTokens: jest.Mock;
  };
  let config: {
    get: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      trustedContact: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      trip: {
        findFirst: jest.fn(),
      },
      sosAlert: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      pushDevice: {
        findMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    push = {
      sendToTokens: jest.fn(),
    };

    config = {
      get: jest.fn().mockReturnValue('https://noori.app'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafetyService,
        { provide: PrismaService, useValue: prisma },
        { provide: PushService, useValue: push },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<SafetyService>(SafetyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listContacts', () => {
    it('returns user trusted contacts in asc order', async () => {
      const mockContacts = [{ id: 'contact-1', name: 'Zia' }];
      prisma.trustedContact.findMany.mockResolvedValue(mockContacts);

      const result = await service.listContacts('user-1');
      expect(result).toEqual(mockContacts);
      expect(prisma.trustedContact.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('addContact', () => {
    it('upserts a trusted contact after trimming details', async () => {
      const mockContact = { id: 'contact-1', name: 'Zia', phone: '+93700000000' };
      prisma.trustedContact.upsert.mockResolvedValue(mockContact);

      const result = await service.addContact('user-1', {
        name: ' Zia ',
        phone: ' +93700000000 ',
        relation: 'Brother',
      });

      expect(result).toEqual(mockContact);
      expect(prisma.trustedContact.upsert).toHaveBeenCalledWith({
        where: { userId_phone: { userId: 'user-1', phone: '+93700000000' } },
        update: {
          name: 'Zia',
          relation: 'Brother',
          notifyOnSos: true,
          notifyOnTrip: false,
        },
        create: {
          userId: 'user-1',
          name: 'Zia',
          phone: '+93700000000',
          relation: 'Brother',
          notifyOnSos: true,
          notifyOnTrip: false,
        },
      });
    });
  });

  describe('removeContact', () => {
    it('removes contact successfully if it exists and belongs to user', async () => {
      prisma.trustedContact.findUnique.mockResolvedValue({
        id: 'contact-1',
        userId: 'user-1',
      });

      const result = await service.removeContact('user-1', 'contact-1');
      expect(result).toEqual({ id: 'contact-1', removed: true });
      expect(prisma.trustedContact.delete).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
      });
    });

    it('throws NotFoundException if contact does not exist or belongs to another user', async () => {
      prisma.trustedContact.findUnique.mockResolvedValue(null);

      await expect(
        service.removeContact('user-1', 'contact-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('raiseSos', () => {
    it('raises an SOS alert and fetches related contacts, user, and adminDevices in parallel', async () => {
      prisma.trip.findFirst.mockResolvedValue({
        id: 'trip-1',
        safetyCode: '9876',
      });

      const mockAlert = { id: 'alert-1', userId: 'user-1' };
      prisma.sosAlert.create.mockResolvedValue(mockAlert);

      prisma.trustedContact.findMany.mockResolvedValue([
        { id: 'c-1', phone: '+9370001' },
      ]);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Ahmad',
        phone: '+9370000',
      });
      prisma.pushDevice.findMany.mockResolvedValue([
        { token: 'admin-device-token' },
      ]);

      const result = await service.raiseSos('user-1', {
        tripId: 'trip-1',
        lat: 34.5,
        lng: 69.2,
        message: 'Help!',
      });

      expect(prisma.sosAlert.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          tripId: 'trip-1',
          lat: 34.5,
          lng: 69.2,
          message: 'Help!',
        },
      });

      // Verify that all three queries were run (they are parallelized under the hood)
      expect(prisma.trustedContact.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', notifyOnSos: true },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { name: true, phone: true },
      });
      expect(prisma.pushDevice.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          user: { role: { in: ['ADMIN', 'SUPPORT'] as any } },
        },
        select: { token: true },
      });

      // Verify push and audit log
      expect(push.sendToTokens).toHaveBeenCalledWith(
        ['admin-device-token'],
        'SOS triggered',
        'Ahmad has triggered an SOS. Track at https://noori.app/share/9876',
        { type: 'SOS', alertId: 'alert-1', tripId: 'trip-1' },
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'SOS_RAISED',
          entityType: 'SosAlert',
          entityId: 'alert-1',
          actorId: 'user-1',
          after: { tripId: 'trip-1', lat: 34.5, lng: 69.2 },
        },
      });

      expect(result).toEqual({
        alert: mockAlert,
        notifiedContacts: 1,
        shareUrl: 'https://noori.app/share/9876',
      });
    });

    it('throws ForbiddenException if trip is not assigned to user', async () => {
      prisma.trip.findFirst.mockResolvedValue(null);

      await expect(
        service.raiseSos('user-1', { tripId: 'trip-1' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('resolveSos', () => {
    it('resolves active SOS alert successfully', async () => {
      const mockAlert = {
        id: 'alert-1',
        userId: 'user-1',
        status: SosStatus.ACTIVE,
      };
      prisma.sosAlert.findUnique.mockResolvedValue(mockAlert);

      const mockResolved = {
        id: 'alert-1',
        status: SosStatus.RESOLVED,
        resolvedAt: new Date(),
      };
      prisma.sosAlert.update.mockResolvedValue(mockResolved);

      const result = await service.resolveSos('alert-1', 'admin-1', true);
      expect(result).toEqual(mockResolved);
      expect(prisma.sosAlert.update).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
        data: expect.objectContaining({
          status: SosStatus.RESOLVED,
          resolvedBy: 'admin-1',
        }),
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('throws NotFoundException if SOS alert does not exist', async () => {
      prisma.sosAlert.findUnique.mockResolvedValue(null);

      await expect(
        service.resolveSos('alert-1', 'admin-1', true),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if non-staff tries to resolve someone else SOS', async () => {
      prisma.sosAlert.findUnique.mockResolvedValue({
        id: 'alert-1',
        userId: 'user-2',
        status: SosStatus.ACTIVE,
      });

      await expect(
        service.resolveSos('alert-1', 'user-1', false),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
