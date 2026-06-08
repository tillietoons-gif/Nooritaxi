import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { FraudService } from './fraud.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('admin/fraud')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get('dashboard')
  @RequirePermission('fraud.view')
  getDashboardAnalytics() {
    return this.fraudService.getDashboardAnalytics();
  }

  @Get('alerts')
  @RequirePermission('fraud.view')
  getAlerts(@Query('status') status?: 'OPEN' | 'RESOLVED') {
    return this.fraudService.getAlerts(status);
  }

  @Put('alerts/:id/resolve')
  @RequirePermission('fraud.edit')
  resolveAlert(@Param('id') id: string) {
    return this.fraudService.resolveAlert(id);
  }

  @Get('cases')
  @RequirePermission('fraud.view')
  getCases() {
    return this.fraudService.getCases();
  }

  @Get('cases/:id')
  @RequirePermission('fraud.view')
  getCaseDetails(@Param('id') id: string) {
    return this.fraudService.getCaseDetails(id);
  }

  @Post('cases/:id/notes')
  @RequirePermission('fraud.edit')
  addCaseNote(
    @Request() req,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.fraudService.addCaseNote(id, req.user.userId, content);
  }

  @Get('blacklist')
  @RequirePermission('fraud.view')
  getBlacklist() {
    return this.fraudService.getBlacklist();
  }

  @Post('blacklist')
  @RequirePermission('fraud.edit')
  addBlacklist(
    @Request() req,
    @Body() body: { type: string; value: string; reason: string },
  ) {
    return this.fraudService.addBlacklist(
      req.user.userId,
      body.type,
      body.value,
      body.reason,
    );
  }

  @Get('accounts')
  @RequirePermission('fraud.view')
  getAccounts() {
    return this.fraudService.getHighRiskAccounts();
  }

  @Get('devices')
  @RequirePermission('fraud.view')
  getDevices() {
    return this.fraudService.getDevices();
  }
}
