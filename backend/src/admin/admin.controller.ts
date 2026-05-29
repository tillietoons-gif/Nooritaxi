import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPPORT)
export class AdminController {
  constructor(private admin: AdminService) {}

  private parseListArgs(
    status?: string,
    q?: string,
    page?: string,
    limit?: string,
    from?: string,
    to?: string,
  ) {
    return {
      status: status?.trim() || undefined,
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      from: from?.trim() || undefined,
      to: to?.trim() || undefined,
    };
  }

  @Get('trips')
  listTrips(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.admin.listTrips(this.parseListArgs(status, q, page, limit, from, to));
  }

  @Get('trips/:id')
  getTrip(@Param('id') id: string) {
    return this.admin.getTrip(id);
  }

  @Get('orders')
  listOrders(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.admin.listOrders(this.parseListArgs(status, q, page, limit, from, to));
  }

  @Get('deliveries')
  listDeliveries(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.admin.listDeliveries(this.parseListArgs(status, q, page, limit, from, to));
  }

  @Get('drivers')
  listDrivers(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listDrivers(this.parseListArgs(status, q, page, limit));
  }

  @Get('users')
  listUsers(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
  ) {
    return this.admin.listUsers({ ...this.parseListArgs(status, q, page, limit), role });
  }

  // ---- Action endpoints ----

  @Patch('trips/:id/status')
  updateTripStatus(@Param('id') id: string, @Body('status') status: string, @CurrentUser() actor: any) {
    return this.admin.updateTripStatus(id, status, actor?.userId);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: string, @CurrentUser() actor: any) {
    return this.admin.updateOrderStatus(id, status, actor?.userId);
  }

  @Patch('users/:id/status')
  updateUserStatus(@Param('id') id: string, @Body('status') status: string, @CurrentUser() actor: any) {
    return this.admin.updateUserStatus(id, status, actor?.userId);
  }

  @Get('drivers/:id/documents')
  listDriverDocuments(@Param('id') driverId: string) {
    return this.admin.listDriverDocuments(driverId);
  }

  @Patch('drivers/:id/documents/:docId')
  updateDocumentStatus(
    @Param('id') driverId: string,
    @Param('docId') docId: string,
    @Body('status') status: string,
    @CurrentUser() actor: any,
  ) {
    return this.admin.updateDocumentStatus(driverId, docId, status, actor?.userId);
  }

  @Get('sos')
  listActiveSos() {
    return this.admin.listActiveSos();
  }

  @Patch('sos/:id/resolve')
  resolveSos(@Param('id') alertId: string, @CurrentUser() actor: any) {
    return this.admin.resolveSos(alertId, actor?.userId);
  }
}
