import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    validateUser: jest.Mock;
    login: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('logs in non-driver users from the web client', async () => {
    const loginDto = { phone: '+93700111222', password: 'SecurePass123!' };
    const user = {
      id: 'user-1',
      phone: loginDto.phone,
      role: UserRole.RIDER,
    };
    const tokens = { access_token: 'token-1', user };

    authService.validateUser.mockResolvedValue(user);
    authService.login.mockResolvedValue(tokens);

    await expect(controller.login(loginDto, 'web')).resolves.toEqual(tokens);
    expect(authService.validateUser).toHaveBeenCalledWith(
      loginDto.phone,
      loginDto.password,
    );
    expect(authService.login).toHaveBeenCalledWith(user);
  });

  it('rejects driver logins from the web client', async () => {
    const loginDto = { phone: '+93700999888', password: 'SecurePass123!' };
    const user = {
      id: 'driver-1',
      phone: loginDto.phone,
      role: UserRole.DRIVER,
    };

    authService.validateUser.mockResolvedValue(user);

    await expect(controller.login(loginDto, 'web')).rejects.toThrow(
      new UnauthorizedException('Drivers must sign in through the mobile app'),
    );
    expect(authService.login).not.toHaveBeenCalled();
  });
});
