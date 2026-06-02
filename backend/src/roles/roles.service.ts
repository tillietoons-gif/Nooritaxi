import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          }
        },
        _count: {
          select: { admins: true }
        }
      }
    });
  }

  async getPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  async createRole(data: { name: string; description?: string; permissions: string[] }) {
    const existing = await this.prisma.role.findUnique({ where: { name: data.name }});
    if (existing) throw new BadRequestException('Role name already exists');

    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: data.name,
          description: data.description,
        }
      });

      if (data.permissions && data.permissions.length > 0) {
        const perms = await tx.permission.findMany({
          where: { name: { in: data.permissions } }
        });

        await tx.rolePermission.createMany({
          data: perms.map(p => ({
            roleId: role.id,
            permissionId: p.id,
          }))
        });
      }

      return role;
    });
  }

  async updateRole(id: string, data: { name: string; description?: string; permissions: string[] }) {
    const role = await this.prisma.role.findUnique({ where: { id }});
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('Cannot modify system roles');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.role.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
        }
      });

      if (data.permissions) {
        // Delete all old permissions
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        
        // Find new permissions
        const perms = await tx.permission.findMany({
          where: { name: { in: data.permissions } }
        });

        await tx.rolePermission.createMany({
          data: perms.map(p => ({
            roleId: id,
            permissionId: p.id,
          }))
        });
      }

      return updated;
    });
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id }, include: { _count: { select: { admins: true } } }});
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('Cannot delete system roles');
    if (role._count.admins > 0) throw new BadRequestException('Cannot delete role with assigned admins');

    return this.prisma.role.delete({ where: { id } });
  }

  // Assign multiple roles to an admin user
  async assignAdminRoles(adminId: string, roleAssignments: { roleId: string, cityScope?: string }[]) {
    return this.prisma.$transaction(async (tx) => {
      // Clear existing
      await tx.adminRole.deleteMany({ where: { adminId } });
      
      if (roleAssignments.length > 0) {
        await tx.adminRole.createMany({
          data: roleAssignments.map(ra => ({
            adminId,
            roleId: ra.roleId,
            cityScope: ra.cityScope || null
          }))
        });
      }
      return true;
    });
  }
}
