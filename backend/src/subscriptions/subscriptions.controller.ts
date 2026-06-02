import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SubscriptionsController {
  constructor(private readonly subService: SubscriptionsService) {}

  @Get('plans')
  @RequirePermission('subscriptions.view')
  getPlans() {
    return this.subService.getPlans();
  }

  @Post('plans')
  @RequirePermission('subscriptions.edit')
  createPlan(@Body() data: any) {
    return this.subService.createPlan(data);
  }

  @Get('active')
  @RequirePermission('subscriptions.view')
  getActiveSubscriptions() {
    return this.subService.getActiveSubscriptions();
  }

  @Post('assign')
  @RequirePermission('subscriptions.edit')
  assignSubscription(@Body() data: any) {
    return this.subService.assignSubscription(data);
  }
}
