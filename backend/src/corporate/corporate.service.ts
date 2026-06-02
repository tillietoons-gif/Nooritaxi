import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CorporateService {
  constructor(private prisma: PrismaService) {}

  // ==========================
  // Organizations
  // ==========================

  async getOrganizations() {
    return this.prisma.organization.findMany({
      include: {
        _count: { select: { employees: true, invoices: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOrganizationDetails(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        departments: true,
        branches: true,
        wallet: true,
        contracts: true,
        _count: { select: { employees: true } }
      }
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async createOrganization(data: any) {
    return this.prisma.organization.create({
      data: {
        companyName: data.companyName,
        legalName: data.legalName,
        industry: data.industry,
        email: data.email,
        phone: data.phone,
        address: data.address,
        status: data.status || 'PENDING',
        wallet: { create: { currency: 'AFN' } } // Auto create wallet
      }
    });
  }

  // ==========================
  // Employees
  // ==========================

  async getEmployees(orgId: string) {
    return this.prisma.employee.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { name: true, phone: true } },
        department: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async addEmployee(orgId: string, data: any) {
    return this.prisma.employee.create({
      data: {
        organizationId: orgId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        jobTitle: data.jobTitle,
        departmentId: data.departmentId,
        role: data.role || 'EMPLOYEE'
      }
    });
  }

  // ==========================
  // Budgets
  // ==========================

  async getBudgets(orgId: string) {
    return this.prisma.budget.findMany({
      where: { organizationId: orgId },
      include: { department: true }
    });
  }

  async createBudget(orgId: string, data: any) {
    return this.prisma.budget.create({
      data: {
        organizationId: orgId,
        departmentId: data.departmentId,
        amount: data.amount,
        period: data.period,
      }
    });
  }

  // ==========================
  // Policies
  // ==========================

  async getPolicies(orgId: string) {
    return this.prisma.corporatePolicy.findMany({
      where: { organizationId: orgId }
    });
  }

  async createPolicy(orgId: string, data: any) {
    return this.prisma.corporatePolicy.create({
      data: {
        organizationId: orgId,
        name: data.name,
        description: data.description,
        rules: data.rules
      }
    });
  }

  // ==========================
  // Invoices & Billing
  // ==========================

  async getInvoices(orgId: string) {
    return this.prisma.invoice.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async generateInvoice(orgId: string, data: { periodStart: Date, periodEnd: Date, total: number }) {
    return this.prisma.invoice.create({
      data: {
        organizationId: orgId,
        invoiceNumber: `INV-${Date.now()}`,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        total: data.total,
        status: 'DRAFT'
      }
    });
  }

  // ==========================
  // Contracts
  // ==========================

  async getContracts() {
    return this.prisma.contract.findMany({
      include: { organization: { select: { companyName: true } } },
      orderBy: { endDate: 'asc' }
    });
  }
}
