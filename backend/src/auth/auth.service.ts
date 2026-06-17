import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma, User, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { randomBytes, randomInt } from 'crypto';

const REFERRAL_CREDIT_AFN = 50;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private walletService: WalletService,
  ) {}

  async validateUser(phone: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(phone);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async sendOtp(phone: string): Promise<void> {
    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.phoneOtp.updateMany({
        where: { phone, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.phoneOtp.create({
        data: { phone, codeHash, expiresAt },
      }),
    ]);

    const smsProvider = this.configService.get<string>('SMS_PROVIDER');
    if (!smsProvider) {
      console.log(`OTP for ${phone}: ${code}`);
      return;
    }

    await this.dispatchOtp(phone, code, smsProvider);
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const record = await this.findMatchingOtp(phone, code);
    if (!record) {
      return false;
    }

    await this.prisma.$transaction([
      this.prisma.phoneOtp.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.updateMany({
        where: { phone },
        data: { isVerified: true, status: UserStatus.ACTIVE },
      }),
    ]);

    return true;
  }

  async resetPassword(
    phone: string,
    code: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.usersService.findOne(phone);
    if (!user) {
      return false;
    }

    const record = await this.findMatchingOtp(phone, code);
    if (!record) {
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.phoneOtp.update({
        where: { id: record.id },
        data: { usedAt: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          isVerified: true,
          status: UserStatus.ACTIVE,
        },
      }),
    ]);

    return true;
  }

  async login(user: any) {
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    return this.issueTokens(user, this.prisma, payload);
  }

  async currentUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid session');
    return this.stripPassword(user);
  }

  async register(data: any) {
    const role = data.role ?? UserRole.RIDER;
    if (![UserRole.RIDER, UserRole.DRIVER, UserRole.MERCHANT].includes(role)) {
      throw new BadRequestException('This role cannot self-register');
    }

    // Optimization: Parallelize password hashing and referrer lookup to reduce registration latency
    const [hashedPassword, referrer] = await Promise.all([
      bcrypt.hash(data.password, 10),
      data.referredByCode
        ? this.prisma.user.findUnique({
            where: { referralCode: data.referredByCode },
          })
        : Promise.resolve(null),
    ]);

    const referredById = referrer?.id;
    const status =
      role === UserRole.RIDER
        ? UserStatus.ACTIVE
        : UserStatus.PENDING_VERIFICATION;

    const user = await this.usersService.create({
      name: data.name,
      phone: data.phone,
      email: data.email,
      role,
      password: hashedPassword,
      referralCode: this.createReferralCode(data.phone),
      referredById,
      status,
    });

    // Award referral credits
    if (referredById) {
      const key = `referral:${referredById}:${user.id}`;
      await Promise.allSettled([
        this.walletService.deposit(
          user.id,
          REFERRAL_CREDIT_AFN,
          'CUSTOMER',
          'AFN',
          `${key}:new-user`,
          {
            transactionType: 'REFERRAL_CREDIT',
            description: 'Referral welcome bonus',
          },
        ),
        this.walletService.deposit(
          referredById,
          REFERRAL_CREDIT_AFN,
          'CUSTOMER',
          'AFN',
          `${key}:referrer`,
          {
            transactionType: 'REFERRAL_CREDIT',
            description: 'Referral reward',
          },
        ),
      ]);
    }

    return this.login(user);
  }

  async refresh(userId: string, rawRefreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const matchedToken = await this.findActiveRefreshToken(
      userId,
      rawRefreshToken,
    );
    if (!matchedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const payload = { sub: user.id, phone: user.phone, role: user.role };
    return this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: matchedToken.id },
        data: { revokedAt: new Date() },
      });

      return this.issueTokens(user, tx, payload);
    });
  }

  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    const matchedToken = await this.findActiveRefreshToken(
      userId,
      rawRefreshToken,
    );
    if (!matchedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revokedAt: new Date() },
    });
  }

  private createReferralCode(seed: string) {
    const suffix =
      seed.replace(/\D/g, '').slice(-5) ||
      Math.random().toString(36).slice(2, 7).toUpperCase();
    return `NOORI${suffix}`;
  }

  private async dispatchOtp(
    phone: string,
    code: string,
    smsProvider: string,
  ): Promise<void> {
    const providerUrl = smsProvider.startsWith('http')
      ? smsProvider
      : this.configService.get<string>('SMS_PROVIDER_URL');

    if (smsProvider.toLowerCase() === 'twilio') {
      await this.dispatchTwilioOtp(phone, code);
      return;
    }

    if (!providerUrl) {
      console.log(`OTP for ${phone}: ${code}`);
      return;
    }

    const providerToken = this.configService.get<string>('SMS_PROVIDER_TOKEN');
    const response = await fetch(providerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(providerToken ? { Authorization: `Bearer ${providerToken}` } : {}),
      },
      body: JSON.stringify({ phone, code }),
    });

    if (!response.ok) {
      throw new UnauthorizedException('OTP provider request failed');
    }
  }

  private async dispatchTwilioOtp(phone: string, code: string): Promise<void> {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.configService.get<string>('TWILIO_FROM_NUMBER');

    if (!accountSid || !authToken || !from) {
      throw new UnauthorizedException('Twilio SMS configuration is incomplete');
    }

    const body = new URLSearchParams({
      From: from,
      To: phone,
      Body: `Your Noori verification code is ${code}. It expires in 10 minutes.`,
    });
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
      'base64',
    );
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      throw new UnauthorizedException('Twilio SMS request failed');
    }
  }

  private async issueTokens(
    user: User | Omit<User, 'password'>,
    prisma: Prisma.TransactionClient | PrismaService,
    payload = { sub: user.id, phone: user.phone, role: user.role },
  ) {
    const rawRefreshToken = randomBytes(40).toString('hex');
    const tokenHash = await bcrypt.hash(rawRefreshToken, 10);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const sanitizedUser = 'password' in user ? this.stripPassword(user) : user;

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: rawRefreshToken,
      user: sanitizedUser,
    };
  }

  private async findActiveRefreshToken(
    userId: string,
    rawRefreshToken: string,
  ) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const token of tokens) {
      if (await bcrypt.compare(rawRefreshToken, token.tokenHash)) {
        return token;
      }
    }

    return null;
  }

  private async findMatchingOtp(phone: string, code: string) {
    const record = await this.prisma.phoneOtp.findFirst({
      where: {
        phone,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return null;
    }

    const isValid = await bcrypt.compare(code, record.codeHash);
    if (!isValid) {
      return null;
    }

    return record;
  }

  private stripPassword(user: User) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
