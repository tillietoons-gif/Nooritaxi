import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super Admin check (optional if you want Super Admin to bypass)
    // Or we check if user has a role with isSystem=true maybe
    const adminRoles = await this.prisma.adminRole.findMany({
      where: { adminId: user.userId }, // Assuming jwt payload has userId
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!adminRoles || adminRoles.length === 0) {
      throw new ForbiddenException('No admin roles assigned');
    }

    const userPermissions = new Set<string>();
    
    // Check if any role is a Super Admin
    let isSuperAdmin = false;
    for (const ar of adminRoles) {
      if (ar.role.name === 'Super Admin') {
        isSuperAdmin = true;
      }
      for (const rp of ar.role.permissions) {
        userPermissions.add(rp.permission.name);
      }
    }

    if (isSuperAdmin) {
      return true;
    }

    const hasPermission = requiredPermissions.every((perm) => userPermissions.has(perm));
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Pass admin roles down to request in case cityScope is needed
    request.adminRoles = adminRoles;

    return true;
  }
}
