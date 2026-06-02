import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CorporateService } from './corporate.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('admin/corporate')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CorporateController {
  constructor(private readonly corporateService: CorporateService) {}

  @Get()
  @RequirePermission('corporate.view')
  getOrganizations() {
    return this.corporateService.getOrganizations();
  }

  @Post()
  @RequirePermission('corporate.edit')
  createOrganization(@Body() data: any) {
    return this.corporateService.createOrganization(data);
  }

  @Get(':id')
  @RequirePermission('corporate.view')
  getOrganizationDetails(@Param('id') id: string) {
    return this.corporateService.getOrganizationDetails(id);
  }

  @Get(':id/employees')
  @RequirePermission('corporate.view')
  getEmployees(@Param('id') id: string) {
    return this.corporateService.getEmployees(id);
  }

  @Post(':id/employees')
  @RequirePermission('corporate.edit')
  addEmployee(@Param('id') id: string, @Body() data: any) {
    return this.corporateService.addEmployee(id, data);
  }

  @Get(':id/budgets')
  @RequirePermission('corporate.view')
  getBudgets(@Param('id') id: string) {
    return this.corporateService.getBudgets(id);
  }

  @Post(':id/budgets')
  @RequirePermission('corporate.edit')
  createBudget(@Param('id') id: string, @Body() data: any) {
    return this.corporateService.createBudget(id, data);
  }

  @Get(':id/policies')
  @RequirePermission('corporate.view')
  getPolicies(@Param('id') id: string) {
    return this.corporateService.getPolicies(id);
  }

  @Post(':id/policies')
  @RequirePermission('corporate.edit')
  createPolicy(@Param('id') id: string, @Body() data: any) {
    return this.corporateService.createPolicy(id, data);
  }

  @Get(':id/invoices')
  @RequirePermission('corporate.view')
  getInvoices(@Param('id') id: string) {
    return this.corporateService.getInvoices(id);
  }

  @Get('contracts/all')
  @RequirePermission('corporate.view')
  getAllContracts() {
    return this.corporateService.getContracts();
  }
}
