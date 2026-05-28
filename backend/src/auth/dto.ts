import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class LoginDto {
  @IsString()
  phone: string;

  @IsString()
  password: string;
}

export class RegisterDto {
  @IsString()
  name: string;

  @IsString()
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
