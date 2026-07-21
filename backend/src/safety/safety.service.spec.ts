/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import {
  SafetyService,
  CreateTrustedContactInput,
  RaiseSosInput,
} from './safety.service';
import { PrismaService } from '../prisma.service';
import { PushService } from '../push/push.service';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SosStatus, TripStatus } from '@prisma/client';

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
      get: jest.fn(),
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
    it('should retrieve list of trusted contacts for a user', async () => {
      const mockContacts = [{ id: '1', name: 'John Doe', phone: '+12345' }];
      prisma.trustedContact.findMany.mockResolvedValue(mockContacts);

      const result = await service.listContacts('user-1');
      expect(prisma.trustedContact.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockContacts);
    });
  });

  describe('addContact', () => {
    it('should throw BadRequestException if contact name is empty', async () => {
      const input: CreateTrustedContactInput = { name: '', phone: '+12345' };
      await expect(service.addContact('user-1', input)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if contact phone is empty', async () => {
      const input: CreateTrustedContactInput = { name: 'John', phone: '' };
      await expect(service.addContact('user-1', input)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should upsert trusted contact', async () => {
      const input: CreateTrustedContactInput = {
        name: 'John Doe',
        phone: ' +123456789 ',
        relation: 'Brother',
        notifyOnSos: true,
        notifyOnTrip: false,
      };

      const mockContact = {
        id: 'contact-1',
        userId: 'user-1',
        name: 'John Doe',
        phone: '+123456789',
        relation: 'Brother',
        notifyOnSos: true,
        notifyOnTrip: false,
      };

      prisma.trustedContact.upsert.mockResolvedValue(mockContact);

      const result = await service.addContact('user-1', input);

      expect(prisma.trustedContact.upsert).toHaveBeenCalledWith({
        where: { userId_phone: { userId: 'user-1', phone: '+123456789' } },
        update: {
          name: 'John Doe',
          relation: 'Brother',
          notifyOnSos: true,
          notifyOnTrip: false,
        },
        create: {
          userId: 'user-1',
          name: 'John Doe',
          phone: '+123456789',
          relation: 'Brother',
          notifyOnSos: true,
          notifyOnTrip: false,
        },
      });
      expect(result).toEqual(mockContact);
    });
  });

  describe('removeContact', () => {
    it('should throw NotFoundException if contact does not exist', async () => {
      prisma.trustedContact.findUnique.mockResolvedValue(null);
      await expect(
        service.removeContact('user-1', 'contact-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if contact belongs to another user', async () => {
      prisma.trustedContact.findUnique.mockResolvedValue({
        id: 'contact-1',
        userId: 'user-2',
      });
      await expect(
        service.removeContact('user-1', 'contact-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should successfully remove contact', async () => {
      prisma.trustedContact.findUnique.mockResolvedValue({
        id: 'contact-1',
        userId: 'user-1',
      });
      prisma.trustedContact.delete.mockResolvedValue({ id: 'contact-1' });

      const result = await service.removeContact('user-1', 'contact-1');
      expect(prisma.trustedContact.delete).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
      });
      expect(result).toEqual({ id: 'contact-1', removed: true });
    });
  });

  describe('raiseSos', () => {
    it('should throw ForbiddenException if tripId provided but trip not found or unassigned', async () => {
      prisma.trip.findFirst.mockResolvedValue(null);
      const input: RaiseSosInput = { tripId: 'trip-1' };
      await expect(service.raiseSos('user-1', input)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should raise SOS and notify contacts and admin/support push devices', async () => {
      const input: RaiseSosInput = {
        tripId: 'trip-1',
        lat: 34.5,
        lng: 69.1,
        message: 'Help!',
      };

      prisma.trip.findFirst.mockResolvedValue({
        id: 'trip-1',
        safetyCode: 'safe-123',
      });

      const mockAlert = {
        id: 'alert-1',
        userId: 'user-1',
        tripId: 'trip-1',
        lat: 34.5,
        lng: 69.1,
        message: 'Help!',
      };
      prisma.sosAlert.create.mockResolvedValue(mockAlert);

      const mockContacts = [{ id: 'c1', phone: '+123', notifyOnSos: true }];
      prisma.trustedContact.findMany.mockResolvedValue(mockContacts);

      const mockUser = { id: 'user-1', name: 'Kabir', phone: '+111' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const mockAdminDevices = [{ token: 'token-admin-1' }];
      prisma.pushDevice.findMany.mockResolvedValue(mockAdminDevices);

      config.get.mockReturnValue('https://noori.app/');

      const result = await service.raiseSos('user-1', input);

      expect(prisma.trip.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'trip-1',
          OR: [{ customerId: 'user-1' }, { driverId: 'user-1' }],
        },
        select: { id: true, safetyCode: true },
      });

      expect(prisma.sosAlert.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          tripId: 'trip-1',
          lat: 34.5,
          lng: 69.1,
          message: 'Help!',
        },
      });

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
          user: { role: { in: ['ADMIN', 'SUPPORT'] } },
        },
        select: { token: true },
      });

      expect(push.sendToTokens).toHaveBeenCalledWith(
        ['token-admin-1'],
        'SOS triggered',
        'Kabir has triggered an SOS. Track at https://noori.app/share/safe-123',
        {
          type: 'SOS',
          alertId: 'alert-1',
          tripId: 'trip-1',
        },
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'SOS_RAISED',
          entityType: 'SosAlert',
          entityId: 'alert-1',
          actorId: 'user-1',
          after: { tripId: 'trip-1', lat: 34.5, lng: 69.1 },
        },
      });

      expect(result).toEqual({
        alert: mockAlert,
        notifiedContacts: 1,
        shareUrl: 'https://noori.app/share/safe-123',
      });
    });
  });

  describe('resolveSos', () => {
    it('should throw NotFoundException if SOS alert not found', async () => {
      prisma.sosAlert.findUnique.mockResolvedValue(null);
      await expect(
        service.resolveSos('alert-1', 'actor-1', false),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user tries to resolve another user SOS and is not staff', async () => {
      prisma.sosAlert.findUnique.mockResolvedValue({
        id: 'alert-1',
        userId: 'user-2',
      });
      await expect(
        service.resolveSos('alert-1', 'user-1', false),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return already resolved alert if status is not ACTIVE', async () => {
      const mockAlert = {
        id: 'alert-1',
        userId: 'user-1',
        status: SosStatus.RESOLVED,
      };
      prisma.sosAlert.findUnique.mockResolvedValue(mockAlert);

      const result = await service.resolveSos('alert-1', 'user-1', false);
      expect(result).toEqual(mockAlert);
    });

    it('should successfully resolve ACTIVE SOS alert', async () => {
      const mockAlert = {
        id: 'alert-1',
        userId: 'user-1',
        status: SosStatus.ACTIVE,
      };
      prisma.sosAlert.findUnique.mockResolvedValue(mockAlert);

      const mockResolved = {
        id: 'alert-1',
        userId: 'user-1',
        status: SosStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: 'user-1',
      };
      prisma.sosAlert.update.mockResolvedValue(mockResolved);

      const result = await service.resolveSos('alert-1', 'user-1', false);

      expect(prisma.sosAlert.update).toHaveBeenCalledWith({
        where: { id: 'alert-1' },
        data: expect.objectContaining({
          status: SosStatus.RESOLVED,
          resolvedAt: expect.any(Date),
          resolvedBy: 'user-1',
        }),
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'SOS_RESOLVED',
          entityType: 'SosAlert',
          entityId: 'alert-1',
          actorId: 'user-1',
        }),
      });

      expect(result).toEqual(mockResolved);
    });
  });

  describe('listActiveSosAlerts', () => {
    it('should retrieve active alerts with user information', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          status: SosStatus.ACTIVE,
          user: { id: 'u1', name: 'A', phone: '123' },
        },
      ];
      prisma.sosAlert.findMany.mockResolvedValue(mockAlerts);

      const result = await service.listActiveSosAlerts();
      expect(prisma.sosAlert.findMany).toHaveBeenCalledWith({
        where: { status: SosStatus.ACTIVE },
        include: { user: { select: { id: true, name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockAlerts);
    });
  });

  describe('getPublicTripByCode', () => {
    it('should throw NotFoundException if safetyCode is empty or too short', async () => {
      await expect(service.getPublicTripByCode('')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getPublicTripByCode('ab')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if trip with safetyCode not found', async () => {
      prisma.trip.findFirst.mockResolvedValue(null);
      await expect(service.getPublicTripByCode('abc')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return public trip information with live driver location', async () => {
      const mockTrip = {
        id: 'trip-1',
        status: TripStatus.EN_ROUTE,
        pickupLocation: 'Kabul Airport',
        pickupLat: 34.5,
        pickupLng: 69.1,
        dropoffLocation: 'City Center',
        dropoffLat: 34.6,
        dropoffLng: 69.2,
        requestedAt: new Date(),
        acceptedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        customer: { name: 'Customer A' },
        driver: {
          name: 'Driver B',
          driverProfile: {
            currentLat: 34.55,
            currentLng: 69.15,
            ratingAverage: 4.8,
          },
        },
        vehicle: {
          plateNumber: 'KBL-123',
          make: 'Toyota',
          model: 'Corolla',
          color: 'White',
        },
      };

      prisma.trip.findFirst.mockResolvedValue(mockTrip);

      const result = await service.getPublicTripByCode('safe-123');

      expect(prisma.trip.findFirst).toHaveBeenCalledWith({
        where: { safetyCode: 'safe-123' },
        select: expect.any(Object),
      });

      expect(result).toEqual({
        id: 'trip-1',
        status: TripStatus.EN_ROUTE,
        isLive: true,
        pickup: {
          label: 'Kabul Airport',
          lat: 34.5,
          lng: 69.1,
        },
        dropoff: {
          label: 'City Center',
          lat: 34.6,
          lng: 69.2,
        },
        requestedAt: mockTrip.requestedAt,
        acceptedAt: mockTrip.acceptedAt,
        completedAt: null,
        cancelledAt: null,
        rider: { name: 'Customer A' },
        driver: {
          name: 'Driver B',
          rating: 4.8,
          location: { lat: 34.55, lng: 69.15 },
        },
        vehicle: {
          plate: 'KBL-123',
          description: 'White Toyota Corolla',
        },
      });
    });

    it('should not expose driver location if trip is completed', async () => {
      const mockTrip = {
        id: 'trip-1',
        status: TripStatus.COMPLETED,
        pickupLocation: 'Kabul Airport',
        pickupLat: 34.5,
        pickupLng: 69.1,
        dropoffLocation: 'City Center',
        dropoffLat: 34.6,
        dropoffLng: 69.2,
        requestedAt: new Date(),
        acceptedAt: new Date(),
        completedAt: new Date(),
        cancelledAt: null,
        customer: { name: 'Customer A' },
        driver: {
          name: 'Driver B',
          driverProfile: {
            currentLat: 34.55,
            currentLng: 69.15,
            ratingAverage: 4.8,
          },
        },
        vehicle: {
          plateNumber: 'KBL-123',
          make: 'Toyota',
          model: 'Corolla',
          color: 'White',
        },
      };

      prisma.trip.findFirst.mockResolvedValue(mockTrip);

      const result = await service.getPublicTripByCode('safe-123');

      expect(result.isLive).toBe(false);
      expect(result.driver.location).toBeNull();
    });
  });
});
