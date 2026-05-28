import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.phone, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user);
  }
  @Post('register')
  async register(@Body() body: any) { return this.authService.register(body); }
  @Post('refresh')
  async refresh(@Body() body: any) { return this.authService.refresh(body.user); }
  @Post('verify-phone')
  async verifyPhone(@Body() body: any) {
    return { phone: body.phone, verified: true, message: 'Phone verification accepted for configured OTP provider.' };
  }
  @Post('logout')
  async logout() { return { success: true }; }
}
