import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('admin/finance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('cash-collections')
  @RequirePermission('finance.view')
  getCashCollections(@Query('limit') limit?: string) {
    return this.financeService.getCashCollections(limit ? Number(limit) : undefined);
  }

  @Get('commissions')
  @RequirePermission('finance.view')
  getCommissions() {
    return this.financeService.getSystemCommissions();
  }

  @Post('commissions')
  @RequirePermission('finance.edit')
  setCommission(@Body() data: any) {
    return this.financeService.setSystemCommission(data);
  }

  @Get('settlements')
  @RequirePermission('finance.view')
  getSettlements(
    @Query('status') status?: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'OVERDUE',
  ) {
    return this.financeService.getSettlements(status);
  }

  @Post('collect-cash')
  @RequirePermission('finance.edit')
  collectCash(@Request() req, @Body() data: any) {
    // Inject admin ID from JWT
    data.collectedBy = req.user.userId;
    return this.financeService.collectCash(data);
  }

  @Get('refunds')
  @RequirePermission('finance.view')
  getRefundRequests(@Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.financeService.getRefundRequests(status);
  }

  @Put('refunds/:id')
  @RequirePermission('finance.edit')
  processRefund(@Request() req, @Param('id') id: string, @Body() data: any) {
    data.adminId = req.user.userId;
    return this.financeService.processRefund(id, data);
  }

  @Get('analytics')
  @RequirePermission('finance.view')
  getAnalytics() {
    return this.financeService.getFinanceAnalytics();
  }
}
