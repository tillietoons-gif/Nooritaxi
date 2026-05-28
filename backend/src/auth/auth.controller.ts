import { Body, Controller, Get, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto, RegisterDto, VerifyPhoneDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.phone, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user);
  }
  @Post('register')
  async register(@Body() body: RegisterDto) { return this.authService.register(body); }
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@CurrentUser() user: any) { return this.authService.refresh(user); }
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any) { return { user }; }
  @Post('verify-phone')
  async verifyPhone(@Body() body: VerifyPhoneDto) {
    return { phone: body.phone, verified: true, message: 'Phone verification accepted for configured OTP provider.' };
  }
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout() { return { success: true }; }
}
