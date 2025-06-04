import { Injectable, ForbiddenException } from '@nestjs/common';
import { SystemRole } from '@prisma/client';

@Injectable()
export class EventPermissionService {
  /**************************************
   * PERMISSION VALIDATION METHODS
   **************************************/

  validateEventModification(
    event: any,
    userId: string,
    userRole: SystemRole,
    action: string,
  ) {
    if (userRole === SystemRole.SUPER_ADMIN) {
      // Super admin can do anything
      return;
    }

    if (userRole === SystemRole.ADMIN) {
      // Admin can only modify events THEY organized
      if (event.organizerId !== userId) {
        throw new ForbiddenException(
          `You can only ${action} events that you organize`,
        );
      }
      return;
    }

    // Regular users cannot modify events
    throw new ForbiddenException(
      `You do not have permission to ${action} events`,
    );
  }

  validateEventUpdate(event: any, userId: string, userRole: SystemRole) {
    this.validateEventModification(event, userId, userRole, 'update');
  }

  validateEventDelete(event: any, userId: string, userRole: SystemRole) {
    this.validateEventModification(event, userId, userRole, 'delete');
  }

  validateEventStatusUpdate(event: any, userId: string, userRole: SystemRole) {
    this.validateEventModification(
      event,
      userId,
      userRole,
      'update status for',
    );
  }

  validateVolunteerToggle(event: any, userId: string, userRole: SystemRole) {
    this.validateEventModification(event, userId, userRole, 'update');
  }

  canAccessAdminFeatures(userRole: SystemRole): boolean {
    return userRole === SystemRole.ADMIN || userRole === SystemRole.SUPER_ADMIN;
  }

  canCreateEvent(userRole: SystemRole): boolean {
    return userRole === SystemRole.ADMIN || userRole === SystemRole.SUPER_ADMIN;
  }

  /**************************************
   * ADDITIONAL PERMISSION HELPERS
   **************************************/

  // Helper method to validate if user can create events (throws exception)
  validateEventCreation(userRole: SystemRole) {
    if (!this.canCreateEvent(userRole)) {
      throw new ForbiddenException(
        'You do not have permission to create events. Only admins can create events.',
      );
    }
  }

  // Helper method to validate if user can access admin features (throws exception)
  validateAdminAccess(userRole: SystemRole) {
    if (!this.canAccessAdminFeatures(userRole)) {
      throw new ForbiddenException(
        'You do not have permission to access admin features.',
      );
    }
  }

  // Helper method to check if user is super admin
  isSuperAdmin(userRole: SystemRole): boolean {
    return userRole === SystemRole.SUPER_ADMIN;
  }

  // Helper method to check if user is admin (any level)
  isAdmin(userRole: SystemRole): boolean {
    return userRole === SystemRole.ADMIN || userRole === SystemRole.SUPER_ADMIN;
  }

  // Helper method to check if user is regular user
  isRegularUser(userRole: SystemRole): boolean {
    return userRole === SystemRole.USER;
  }
}
