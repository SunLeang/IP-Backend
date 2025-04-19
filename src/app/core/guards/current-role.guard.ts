import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CURRENT_ROLE_KEY } from '../decorators/current-role.decorator';
import { CurrentRole } from '@prisma/client';

@Injectable()
export class CurrentRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<CurrentRole[]>(CURRENT_ROLE_KEY, [
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

    // Check if user has the required current role
    if (!user.currentRole || !requiredRoles.includes(user.currentRole)) {
      throw new ForbiddenException(`User does not have required current role: ${requiredRoles.join(', ')}`);
    }
    
    return true;
  }
}