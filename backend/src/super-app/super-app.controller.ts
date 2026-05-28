import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SuperAppService } from './super-app.service';
import {
  AddVehicleDto,
  CreateDriverDto,
  CreatePromotionDto,
  CreateSupportTicketDto,
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
