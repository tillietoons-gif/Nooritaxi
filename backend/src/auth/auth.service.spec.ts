import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { create: jest.Mock; findOne: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let walletService: { deposit: jest.Mock };
  let prisma: {
    phoneOtp: { findFirst: jest.Mock; update: jest.Mock };
    refreshToken: { create: jest.Mock; updateMany: jest.Mock };
    user: { findUnique: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findOne: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('access-token') };
    walletService = { deposit: jest.fn() };

    prisma = {
      phoneOtp: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'refresh-1' }),
        updateMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: {} },
        { provide: WalletService, useValue: walletService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects self-registration for privileged roles', async () => {
    await expect(
      service.register({
        name: 'Admin',
        phone: '+93700111111',
        password: 'password123',
        role: UserRole.ADMIN,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('creates riders active and partner roles pending verification', async () => {
    usersService.create.mockImplementation(async (data) => ({
      id: `${data.role.toLowerCase()}-1`,
      phone: data.phone,
      role: data.role,
      name: data.name,
      status: data.status,
      password: data.password,
    }));

    await service.register({
      name: 'Rider',
      phone: '+93700111112',
      password: 'password123',
      role: UserRole.RIDER,
    });
    await service.register({
      name: 'Driver',
      phone: '+93700111113',
      password: 'password123',
      role: UserRole.DRIVER,
    });

    expect(usersService.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        role: UserRole.RIDER,
        status: UserStatus.ACTIVE,
      }),
    );
    expect(usersService.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        role: UserRole.DRIVER,
        status: UserStatus.PENDING_VERIFICATION,
      }),
    );
  });

  it('resets the password when the OTP is valid', async () => {
    const codeHash = await bcrypt.hash('123456', 10);
    usersService.findOne.mockResolvedValue({
      id: 'user-1',
      phone: '+93774920490',
    });
    prisma.phoneOtp.findFirst.mockResolvedValue({
      id: 'otp-1',
      phone: '+93774920490',
      codeHash,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prisma.phoneOtp.update.mockResolvedValue({ id: 'otp-1' });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.update.mockResolvedValue({ id: 'user-1' });

    const result = await service.resetPassword(
      '+93774920490',
      '123456',
      'RecoveredAdmin123!',
    );

    expect(result).toBe(true);
    expect(prisma.phoneOtp.findFirst).toHaveBeenCalled();
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: expect.objectContaining({ revokedAt: expect.any(Date) }),
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        password: expect.any(String),
        isVerified: true,
        status: 'ACTIVE',
      }),
    });
    const updatedPassword = prisma.user.update.mock.calls[0][0].data.password;
    expect(await bcrypt.compare('RecoveredAdmin123!', updatedPassword)).toBe(
      true,
    );
  });

  it('rejects password reset when the OTP does not match', async () => {
    const codeHash = await bcrypt.hash('654321', 10);
    usersService.findOne.mockResolvedValue({
      id: 'user-1',
      phone: '+93774920490',
    });
    prisma.phoneOtp.findFirst.mockResolvedValue({
      id: 'otp-1',
      phone: '+93774920490',
      codeHash,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await service.resetPassword(
      '+93774920490',
      '123456',
      'RecoveredAdmin123!',
    );

    expect(result).toBe(false);
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
