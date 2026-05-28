import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class LoginDto {
  @IsPhoneNumber()
  phone: string;

  @IsString()
  password: string;
}

export class RegisterDto {
  @IsString()
  name: string;

  @IsPhoneNumber()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class VerifyPhoneDto {
  @IsString()
  phone: string;

  @IsString()
  code: string;
}

export class SendOtpDto {
  @IsPhoneNumber()
  phone: string;
}

export class RefreshDto {
  @IsString()
  userId: string;

  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @IsString()
  refreshToken: string;
}
