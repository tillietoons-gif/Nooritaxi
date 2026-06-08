import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findOne: jest.Mock };
  let prisma: {
    phoneOtp: { findFirst: jest.Mock; update: jest.Mock };
    refreshToken: { updateMany: jest.Mock };
    user: { update: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findOne: jest.fn(),
    };

    prisma = {
      phoneOtp: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        updateMany: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: {} },
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: {} },
        { provide: WalletService, useValue: {} },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
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
