import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('admin/support')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('metrics')
  @RequirePermission('support.view')
  getMetrics() {
    return this.supportService.getDashboardMetrics();
  }

  @Get('tickets')
  @RequirePermission('support.view')
  getTickets(@Query('status') status?: string, @Query('priority') priority?: string) {
    return this.supportService.getTickets(status, priority);
  }

  @Get('tickets/:id')
  @RequirePermission('support.view')
  getTicketDetails(@Param('id') id: string) {
    return this.supportService.getTicketDetails(id);
  }

  @Put('tickets/:id/status')
  @RequirePermission('support.edit')
  updateTicketStatus(@Request() req, @Param('id') id: string, @Body('status') status: string) {
    return this.supportService.updateTicketStatus(id, status, req.user.userId);
  }

  @Put('tickets/:id/assign')
  @RequirePermission('support.edit')
  assignTicket(@Param('id') id: string, @Body('assigneeId') assigneeId: string) {
    return this.supportService.assignTicket(id, assigneeId);
  }

  @Post('tickets/:id/messages')
  @RequirePermission('support.reply')
  addMessage(@Request() req, @Param('id') id: string, @Body('message') message: string) {
    return this.supportService.addMessage(id, req.user.userId, message);
  }
}
