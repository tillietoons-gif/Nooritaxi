import { Test, TestingModule } from '@nestjs/testing';
import { DispatchService } from './dispatch.service';
import { PrismaService } from '../prisma.service';

describe('DispatchService', () => {
  let service: DispatchService;
  let prisma: { driver: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { driver: { findMany: jest.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DispatchService>(DispatchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('filters drivers using a bounding box and haversine distance', async () => {
    const pickupLat = 34.53;
    const pickupLng = 69.17;

    // Mock driver inside the box and within distance
    const nearbyDriver = {
      userId: 'driver-1',
      currentLat: 34.531,
      currentLng: 69.171,
      status: 'ONLINE',
      ratingAverage: 4.8,
      vehicles: [{ id: 'v1' }],
    };

    // Mock driver inside the box but outside maxDistanceKm (if maxDistance was very small)
    // For 10km, this one is also very close
    const farDriver = {
      userId: 'driver-2',
      currentLat: 34.63, // approx 11km away
      currentLng: 69.17,
      status: 'ONLINE',
      ratingAverage: 4.5,
      vehicles: [{ id: 'v2' }],
    };

    prisma.driver.findMany.mockResolvedValue([nearbyDriver, farDriver]);

    const result = await service.findNearestOnlineDriver(pickupLat, pickupLng, 5);

    expect(prisma.driver.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ONLINE',
          currentLat: expect.any(Object),
          currentLng: expect.any(Object),
        }),
      }),
    );

    // Should return nearbyDriver because farDriver is ~11km away and limit is 5km
    expect(result?.userId).toBe('driver-1');
  });

  it('sorts by distance and then rating', async () => {
    const pickupLat = 34.53;
    const pickupLng = 69.17;

    const driverA = {
      userId: 'driver-a',
      currentLat: 34.54,
      currentLng: 69.17,
      status: 'ONLINE',
      ratingAverage: 4.0,
      vehicles: [{ id: 'va' }],
    };

    const driverB = {
      userId: 'driver-b',
      currentLat: 34.54,
      currentLng: 69.17,
      status: 'ONLINE',
      ratingAverage: 4.9,
      vehicles: [{ id: 'vb' }],
    };

    // Both are at same distance, B has better rating
    prisma.driver.findMany.mockResolvedValue([driverA, driverB]);

    const result = await service.findNearestOnlineDriver(pickupLat, pickupLng, 10);
    expect(result?.userId).toBe('driver-b');
  });
});
