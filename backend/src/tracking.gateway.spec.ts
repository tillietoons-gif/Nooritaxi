import { Test, TestingModule } from '@nestjs/testing';
import { TrackingGateway } from './tracking.gateway';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('TrackingGateway', () => {
  let gateway: TrackingGateway;
  let prisma: {
    trip: { findFirst: jest.Mock };
    driver: { update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      trip: { findFirst: jest.fn() },
      driver: { update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingGateway,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      ],
    }).compile();

    gateway = module.get<TrackingGateway>(TrackingGateway);
    gateway.server = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('persists assigned driver location updates before broadcasting', async () => {
    prisma.trip.findFirst.mockResolvedValue({ id: 'trip-1' });
    prisma.driver.update.mockResolvedValue({ id: 'driver-1' });

    await gateway.handleUpdateLocation(
      { tripId: 'trip-1', lat: 34.53, lng: 69.17 },
      { data: { user: { id: 'driver-user-1' } } } as any,
    );

    expect(prisma.trip.findFirst).toHaveBeenCalledWith({
      where: { id: 'trip-1', driverId: 'driver-user-1' },
      select: { id: true },
    });
    expect(prisma.driver.update).toHaveBeenCalledWith({
      where: { userId: 'driver-user-1' },
      data: { currentLat: 34.53, currentLng: 69.17 },
    });
    expect(gateway.server.to).toHaveBeenCalledWith('trip_trip-1');
  });
});
