import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryStatus, OrderStatus, PaymentMethod, PromotionScope, PromotionType, ReviewTargetType, TripStatus, VehicleType } from '@prisma/client';

export class CreateDriverDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  nationalIdNumber?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;
}

export class AddVehicleDto {
  @IsEnum(VehicleType)
  type: VehicleType;

  @IsString()
  plateNumber: string;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;
}

export class CreateRideDto {
  @IsString()
  customerId: string;

  @IsString()
  pickupLocation: string;

  @IsString()
  dropoffLocation: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}

export class UpdateRideDto {
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @IsOptional()
  @IsString()
  driverId?: string;
}

export class CreateRestaurantDto {
  @IsString()
  ownerId: string;

  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsArray()
  cuisineTypes?: string[];
}

export class AddMenuItemDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  category?: string;
}

export class OrderItemDto {
  @IsString()
  menuItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}

export class CreateOrderDto {
  @IsString()
  riderId: string;

  @IsString()
  restaurantId: string;

  @IsString()
  deliveryAddress: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];
}

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

export class CreateDeliveryDto {
  @IsString()
  pickupAddress: string;

  @IsString()
  dropoffAddress: string;

  @IsOptional()
  @IsString()
  senderId?: string;
}

export class UpdateDeliveryDto {
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @IsOptional()
  @IsString()
  driverId?: string;
}

export class CreatePromotionDto {
  @IsString()
  code: string;

  @IsString()
  title: string;

  @IsEnum(PromotionType)
  type: PromotionType;

  @IsOptional()
  @IsEnum(PromotionScope)
  scope?: PromotionScope;

  @IsNumber()
  @Min(0)
  value: number;

  @IsString()
  startsAt: string;

  @IsString()
  endsAt: string;
}

export class CreateSupportTicketDto {
  @IsString()
  requesterId: string;

  @IsString()
  category: string;

  @IsString()
  subject: string;

  @IsString()
  description: string;
}

export class CreateReviewDto {
  @IsString()
  authorId: string;

  @IsEnum(ReviewTargetType)
  targetType: ReviewTargetType;

  @IsNumber()
  @Min(1)
  rating: number;
}
