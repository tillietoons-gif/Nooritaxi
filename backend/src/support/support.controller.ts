import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('admin/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPPORT)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('metrics')
  getMetrics() {
    return this.supportService.getDashboardMetrics();
  }

  @Get('tickets')
  getTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.supportService.getTickets(status, priority);
  }

  @Get('tickets/:id')
  getTicketDetails(@Param('id') id: string) {
    return this.supportService.getTicketDetails(id);
  }

  @Put('tickets/:id/status')
  updateTicketStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.supportService.updateTicketStatus(id, status, req.user.id);
  }

  @Put('tickets/:id/assign')
  assignTicket(
    @Param('id') id: string,
    @Body('assigneeId') assigneeId: string,
  ) {
    return this.supportService.assignTicket(id, assigneeId);
  }

  @Post('tickets/:id/messages')
  addMessage(
    @Request() req,
    @Param('id') id: string,
    @Body('message') message: string,
  ) {
    return this.supportService.addMessage(id, req.user.id, message);
  }
}
