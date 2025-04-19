import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SystemRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has required role
    // For system roles, a higher role typically includes permissions of lower roles
    const hasRole = this.hasRequiredRole(user.systemRole, requiredRoles);
    
    if (!hasRole) {
      throw new ForbiddenException(`User does not have sufficient permissions: ${requiredRoles.join(', ')} required`);
    }
    
    return true;
  }

  private hasRequiredRole(userRole: SystemRole, requiredRoles: SystemRole[]): boolean {
    // Define role hierarchy
    const roleHierarchy = {
      [SystemRole.SUPER_ADMIN]: 3,
      [SystemRole.ADMIN]: 2,
      [SystemRole.USER]: 1,
    };

    const userRoleWeight = roleHierarchy[userRole];
    
    return requiredRoles.some(role => {
      const requiredRoleWeight = roleHierarchy[role];
      return userRoleWeight >= requiredRoleWeight;
    });
  }
}