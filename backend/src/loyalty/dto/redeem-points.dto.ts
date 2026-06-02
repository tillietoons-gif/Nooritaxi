import { IsInt, IsNotEmpty, IsPositive, IsString, MinLength } from 'class-validator';

export class RedeemPointsDto {
  @IsInt()
  @IsPositive()
  points: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason: string;
}
