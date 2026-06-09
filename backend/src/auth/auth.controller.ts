import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import {
  LoginDto,
  LogoutDto,
  ResetPasswordDto,
  RefreshDto,
  RegisterDto,
  SendOtpDto,
  VerifyPhoneDto,
} from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async login(
    @Body() body: LoginDto,
    @Headers('x-client-platform') clientPlatform?: string,
  ) {
    const user = await this.authService.validateUser(body.phone, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (clientPlatform === 'web' && user.role === UserRole.DRIVER) {
      throw new UnauthorizedException(
        'Drivers must sign in through the mobile app',
      );
    }
    return this.authService.login(user);
  }

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('send-otp')
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async sendOtp(@Body() body: SendOtpDto) {
    await this.authService.sendOtp(body.phone);
    return { sent: true };
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.userId, body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any) {
    return { user };
  }

  @Post('verify-phone')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async verifyPhone(@Body() body: VerifyPhoneDto) {
    const verified = await this.authService.verifyOtp(body.phone, body.code);
    if (!verified) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    return { verified: true };
  }

  @Post('reset-password')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async resetPassword(@Body() body: ResetPasswordDto) {
    const reset = await this.authService.resetPassword(
      body.phone,
      body.code,
      body.newPassword,
    );
    if (!reset) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    return { reset: true };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: any, @Body() body: LogoutDto) {
    await this.authService.logout(user.id, body.refreshToken);
    return { success: true };
  }
}
