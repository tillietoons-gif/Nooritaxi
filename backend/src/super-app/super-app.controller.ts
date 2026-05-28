import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SuperAppService } from './super-app.service';
import {
  AddMenuItemDto,
  AddVehicleDto,
  CreateDeliveryDto,
  CreateDriverDto,
  CreateOrderDto,
  CreatePromotionDto,
  CreateRestaurantDto,
  CreateReviewDto,
  CreateRideDto,
  CreateSupportTicketDto,
  UpdateDeliveryDto,
  UpdateOrderDto,
  UpdateRideDto,
} from './dto';

@Controller()
export class SuperAppController {
  constructor(private superApp: SuperAppService) {}

  @Post('drivers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  createDriver(@Body() body: CreateDriverDto) {
    return this.superApp.createDriverProfile(body);
  }

  @Get('drivers')
  listDrivers() {
    return this.superApp.listDrivers();
  }

  @Post('drivers/:driverId/vehicles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  addVehicle(@Param('driverId') driverId: string, @Body() body: AddVehicleDto) {
    return this.superApp.addVehicle({ ...body, driverId });
  }

  @Get('vehicles')
  listVehicles(@Query('driverId') driverId?: string) {
    return this.superApp.listVehicles(driverId);
  }

  @Post('riders/:userId')
  @UseGuards(JwtAuthGuard)
  upsertRider(@Param('userId') userId: string, @Body() body: any) {
    return this.superApp.upsertRiderProfile(userId, body);
  }

  @Post('rides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RIDER)
  createRide(@Body() body: CreateRideDto) {
    return this.superApp.createRide(body);
  }

  @Get('rides')
  listRides(@Query('userId') userId?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.superApp.listRides(userId, Number(page ?? 1), Number(limit ?? 25));
  }

  @Patch('rides/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  updateRide(@Param('id') id: string, @Body() body: UpdateRideDto) {
    return this.superApp.updateRide(id, body);
  }

  @Post('restaurants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  createRestaurant(@Body() body: CreateRestaurantDto) {
    return this.superApp.createRestaurant(body);
  }

  @Get('restaurants')
  listRestaurants(@Query('q') query?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.superApp.listRestaurants(query, Number(page ?? 1), Number(limit ?? 25));
  }

  @Post('restaurants/:restaurantId/menu-items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  addMenuItem(@Param('restaurantId') restaurantId: string, @Body() body: AddMenuItemDto) {
    return this.superApp.addMenuItem(restaurantId, body);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RIDER)
  createOrder(@Body() body: CreateOrderDto) {
    return this.superApp.createOrder(body);
  }

  @Get('orders')
  listOrders(@Query('userId') userId?: string, @Query('restaurantId') restaurantId?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.superApp.listOrders(userId, restaurantId, Number(page ?? 1), Number(limit ?? 25));
  }

  @Patch('orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT, UserRole.SUPPORT)
  updateOrder(@Param('id') id: string, @Body() body: UpdateOrderDto) {
    return this.superApp.updateOrder(id, body);
  }

  @Post('deliveries')
  @UseGuards(JwtAuthGuard)
  createDelivery(@Body() body: CreateDeliveryDto) {
    return this.superApp.createDelivery(body);
  }

  @Get('deliveries')
  listDeliveries(@Query('userId') userId?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.superApp.listDeliveries(userId, Number(page ?? 1), Number(limit ?? 25));
  }

  @Patch('deliveries/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER, UserRole.SUPPORT)
  updateDelivery(@Param('id') id: string, @Body() body: UpdateDeliveryDto) {
    return this.superApp.updateDelivery(id, body);
  }

  @Post('promotions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createPromotion(@Body() body: CreatePromotionDto) {
    return this.superApp.createPromotion(body);
  }

  @Get('promotions')
  listPromotions(@Query('all') all?: string) {
    return this.superApp.listPromotions(all !== 'true');
  }

  @Post('promotions/redeem')
  @UseGuards(JwtAuthGuard)
  redeemPromotion(@Body() body: any) {
    return this.superApp.redeemPromotion(body);
  }

  @Post('loyalty/:userId/points')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  addLoyaltyPoints(@Param('userId') userId: string, @Body('points') points: number) {
    return this.superApp.upsertLoyalty(userId, Number(points));
  }

  @Post('notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  createNotification(@Body() body: any) {
    return this.superApp.createNotification(body);
  }

  @Get('notifications/:userId')
  listNotifications(@Param('userId') userId: string) {
    return this.superApp.listNotifications(userId);
  }

  @Post('notifications/devices')
  @UseGuards(JwtAuthGuard)
  registerPushDevice(@Body() body: any) {
    return this.superApp.registerPushDevice(body);
  }

  @Post('support/tickets')
  @UseGuards(JwtAuthGuard)
  createSupportTicket(@Body() body: CreateSupportTicketDto) {
    return this.superApp.createSupportTicket(body);
  }

  @Get('support/tickets')
  listSupportTickets(@Query('status') status?: string) {
    return this.superApp.listSupportTickets(status);
  }

  @Post('support/tickets/:ticketId/messages')
  @UseGuards(JwtAuthGuard)
  addSupportMessage(@Param('ticketId') ticketId: string, @Body() body: any) {
    return this.superApp.addSupportMessage(ticketId, body);
  }

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  createReview(@Body() body: CreateReviewDto) {
    return this.superApp.createReview(body);
  }

  @Get('search')
  smartSearch(@Query('q') query = '') {
    return this.superApp.smartSearch(query);
  }

  @Post('voice-search')
  @UseGuards(JwtAuthGuard)
  voiceSearch(@Body() body: any) {
    return this.superApp.smartSearch(body.transcript ?? body.query ?? '');
  }

  @Get('admin/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  adminOverview() {
    return this.superApp.adminOverview();
  }
}
