import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}
  async validateUser(phone: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(phone);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
  async login(user: any) {
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    return { access_token: this.jwtService.sign(payload), user };
  }
  async register(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
      referralCode: data.referralCode ?? this.createReferralCode(data.phone),
      status: data.status ?? 'ACTIVE',
    });
    return this.login(user);
  }
  async refresh(user: any) {
    return this.login(user);
  }
  private createReferralCode(seed: string) {
    const suffix = seed.replace(/\D/g, '').slice(-5) || Math.random().toString(36).slice(2, 7).toUpperCase();
    return `NOORI${suffix}`;
  }
}
