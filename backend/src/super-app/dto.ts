import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DeliveryStatus,
  OrderStatus,
  PaymentMethod,
  PromotionScope,
  PromotionType,
  ReviewTargetType,
  TripStatus,
  VehicleType,
} from '@prisma/client';

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

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsString()
  pickupLocation: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pickupLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pickupLng?: number;

  @IsString()
  dropoffLocation: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dropoffLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dropoffLng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  distance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  surgeMultiplier?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRideDto {
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  actorId?: string;
}

export class CreateRestaurantDto {
  @IsString()
  ownerId: string;

  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsArray()
  cuisineTypes?: string[];
}

export class AddMenuItemDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  preparationMin?: number;
}

export class OrderItemDto {
  @IsString()
  menuItemId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @Type(() => Number)
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
  @Type(() => Number)
  @IsNumber()
  deliveryLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deliveryLng?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deliveryFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];
}

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  actorId?: string;
}

export class CreateDeliveryDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  senderId?: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  pickupName?: string;

  @IsString()
  pickupAddress: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pickupLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pickupLng?: number;

  @IsOptional()
  @IsString()
  dropoffName?: string;

  @IsString()
  dropoffAddress: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dropoffLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dropoffLng?: number;

  @IsOptional()
  @IsString()
  packageType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  packageWeightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  distance?: number;
}

export class UpdateDeliveryDto {
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  actorId?: string;
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
  @Type(() => Number)
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
