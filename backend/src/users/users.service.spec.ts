import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import { UserRole } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: { create: jest.Mock; findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates rider accounts with a rider profile', async () => {
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      role: UserRole.RIDER,
    });

    await service.create({
      name: 'Rider User',
      phone: '+93700111222',
      password: 'hashed',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Rider User',
        phone: '+93700111222',
        password: 'hashed',
        role: UserRole.RIDER,
        riderProfile: { create: {} },
      }),
    });
  });

  it('creates driver accounts with a driver profile', async () => {
    prisma.user.create.mockResolvedValue({
      id: 'driver-1',
      role: UserRole.DRIVER,
    });

    await service.create({
      name: 'Driver User',
      phone: '+93700999888',
      password: 'hashed',
      role: UserRole.DRIVER,
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Driver User',
        phone: '+93700999888',
        password: 'hashed',
        role: UserRole.DRIVER,
        driverProfile: { create: {} },
      }),
    });
  });
});
