import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @RequirePermission('roles.view')
  getRoles() {
    return this.rolesService.findAllRoles();
  }

  @Get('permissions')
  @RequirePermission('roles.view')
  getPermissions() {
    return this.rolesService.getPermissions();
  }

  @Post()
  @RequirePermission('roles.create')
  createRole(
    @Body() data: { name: string; description?: string; permissions: string[] },
  ) {
    return this.rolesService.createRole(data);
  }

  @Put(':id')
  @RequirePermission('roles.edit')
  updateRole(
    @Param('id') id: string,
    @Body() data: { name: string; description?: string; permissions: string[] },
  ) {
    return this.rolesService.updateRole(id, data);
  }

  @Delete(':id')
  @RequirePermission('roles.delete')
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  @Post('assign/:adminId')
  @RequirePermission('admins.edit')
  assignAdminRoles(
    @Param('adminId') adminId: string,
    @Body() data: { assignments: { roleId: string; cityScope?: string }[] },
  ) {
    return this.rolesService.assignAdminRoles(adminId, data.assignments);
  }
}
