import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SuperAppService } from './super-app.service';

@Controller()
export class SuperAppController {
  constructor(private superApp: SuperAppService) {}

  @Post('drivers')
  createDriver(@Body() body: any) {
    return this.superApp.createDriverProfile(body);
  }

  @Get('drivers')
  listDrivers() {
    return this.superApp.listDrivers();
  }

  @Post('drivers/:driverId/vehicles')
  addVehicle(@Param('driverId') driverId: string, @Body() body: any) {
    return this.superApp.addVehicle({ ...body, driverId });
  }

  @Get('vehicles')
  listVehicles(@Query('driverId') driverId?: string) {
    return this.superApp.listVehicles(driverId);
  }

  @Post('riders/:userId')
  upsertRider(@Param('userId') userId: string, @Body() body: any) {
    return this.superApp.upsertRiderProfile(userId, body);
  }

  @Post('rides')
  createRide(@Body() body: any) {
    return this.superApp.createRide(body);
  }

  @Get('rides')
  listRides(@Query('userId') userId?: string) {
    return this.superApp.listRides(userId);
  }

  @Patch('rides/:id')
  updateRide(@Param('id') id: string, @Body() body: any) {
    return this.superApp.updateRide(id, body);
  }

  @Post('restaurants')
  createRestaurant(@Body() body: any) {
    return this.superApp.createRestaurant(body);
  }

  @Get('restaurants')
  listRestaurants(@Query('q') query?: string) {
    return this.superApp.listRestaurants(query);
  }

  @Post('restaurants/:restaurantId/menu-items')
  addMenuItem(@Param('restaurantId') restaurantId: string, @Body() body: any) {
    return this.superApp.addMenuItem(restaurantId, body);
  }

  @Post('orders')
  createOrder(@Body() body: any) {
    return this.superApp.createOrder(body);
  }

  @Get('orders')
  listOrders(@Query('userId') userId?: string, @Query('restaurantId') restaurantId?: string) {
    return this.superApp.listOrders(userId, restaurantId);
  }

  @Patch('orders/:id')
  updateOrder(@Param('id') id: string, @Body() body: any) {
    return this.superApp.updateOrder(id, body);
  }

  @Post('deliveries')
  createDelivery(@Body() body: any) {
    return this.superApp.createDelivery(body);
  }

  @Get('deliveries')
  listDeliveries(@Query('userId') userId?: string) {
    return this.superApp.listDeliveries(userId);
  }

  @Patch('deliveries/:id')
  updateDelivery(@Param('id') id: string, @Body() body: any) {
    return this.superApp.updateDelivery(id, body);
  }

  @Post('promotions')
  createPromotion(@Body() body: any) {
    return this.superApp.createPromotion(body);
  }

  @Get('promotions')
  listPromotions(@Query('all') all?: string) {
    return this.superApp.listPromotions(all !== 'true');
  }

  @Post('promotions/redeem')
  redeemPromotion(@Body() body: any) {
    return this.superApp.redeemPromotion(body);
  }

  @Post('loyalty/:userId/points')
  addLoyaltyPoints(@Param('userId') userId: string, @Body('points') points: number) {
    return this.superApp.upsertLoyalty(userId, Number(points));
  }

  @Post('notifications')
  createNotification(@Body() body: any) {
    return this.superApp.createNotification(body);
  }

  @Get('notifications/:userId')
  listNotifications(@Param('userId') userId: string) {
    return this.superApp.listNotifications(userId);
  }

  @Post('notifications/devices')
  registerPushDevice(@Body() body: any) {
    return this.superApp.registerPushDevice(body);
  }

  @Post('support/tickets')
  createSupportTicket(@Body() body: any) {
    return this.superApp.createSupportTicket(body);
  }

  @Get('support/tickets')
  listSupportTickets(@Query('status') status?: string) {
    return this.superApp.listSupportTickets(status);
  }

  @Post('support/tickets/:ticketId/messages')
  addSupportMessage(@Param('ticketId') ticketId: string, @Body() body: any) {
    return this.superApp.addSupportMessage(ticketId, body);
  }

  @Post('reviews')
  createReview(@Body() body: any) {
    return this.superApp.createReview(body);
  }

  @Get('search')
  smartSearch(@Query('q') query = '') {
    return this.superApp.smartSearch(query);
  }

  @Post('voice-search')
  voiceSearch(@Body() body: any) {
    return this.superApp.smartSearch(body.transcript ?? body.query ?? '');
  }

  @Get('admin/overview')
  adminOverview() {
    return this.superApp.adminOverview();
  }
}
