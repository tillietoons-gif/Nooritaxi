import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FoodService } from './food.service';

@Controller('food')
export class FoodController {
  constructor(private foodService: FoodService) {}

  @Post('restaurants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  createRestaurant(@Body() body: any, @CurrentUser() user: any) {
    const ownerId = user?.role === UserRole.MERCHANT ? user.id : body.ownerId;
    return this.foodService.createRestaurant({ ...body, ownerId });
  }

  @Get('restaurants')
  listRestaurants(
    @Query('q') query?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.foodService.listRestaurants(
      query,
      Number(page ?? 1),
      Number(limit ?? 25),
    );
  }

  @Get('restaurants/:restaurantId/menu')
  getRestaurantMenu(@Param('restaurantId') restaurantId: string) {
    return this.foodService.getRestaurantMenu(restaurantId);
  }

  @Post('restaurants/:restaurantId/menu-items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  addMenuItem(
    @Param('restaurantId') restaurantId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.foodService.addMenuItem(restaurantId, body, user);
  }

  @Post('restaurants/:restaurantId/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  createMerchantDocument(
    @Param('restaurantId') restaurantId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.foodService.createMerchantDocument(restaurantId, body, user);
  }

  @Get('restaurants/:restaurantId/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT, UserRole.SUPPORT)
  listMerchantDocuments(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    return this.foodService.listMerchantDocuments(restaurantId, user);
  }

  @Patch('restaurants/:restaurantId/menu-items/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  updateMenuItem(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.foodService.updateMenuItem(restaurantId, itemId, body, user);
  }

  @Delete('restaurants/:restaurantId/menu-items/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  deleteMenuItem(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: any,
  ) {
    return this.foodService.deleteMenuItem(restaurantId, itemId, user);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RIDER)
  createOrder(@Body() body: any) {
    return this.foodService.createOrder(body);
  }

  @Get('orders')
  listOrders(
    @Query('userId') userId?: string,
    @Query('restaurantId') restaurantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.foodService.listOrders(
      userId,
      restaurantId,
      Number(page ?? 1),
      Number(limit ?? 25),
    );
  }

  @Patch('orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT, UserRole.SUPPORT)
  updateOrder(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.foodService.updateOrder(id, body, user);
  }
}
