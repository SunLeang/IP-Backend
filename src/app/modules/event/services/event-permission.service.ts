import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SystemRole, VolunteerStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/services/prisma.service';

@Injectable()
export class EventPermissionService {
  constructor(private readonly prisma: PrismaService) {}

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

  /**
   * Check if user can view event attendees
   */
  async validateAttendeeViewPermission(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        name: true,
        organizerId: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check permissions
    if (userRole === SystemRole.SUPER_ADMIN) {
      // Super admin can view attendees for any event
      return event;
    }

    // Check if user is event organizer (for ADMINs, they can only access events they organized)
    if (event.organizerId === userId) {
      return event;
    }

    // For ADMIN role - they can only access events they organize
    if (userRole === SystemRole.ADMIN) {
      throw new ForbiddenException(
        'You can only view attendees for events you organize',
      );
    }

    // Check if user is a volunteer for this event
    const isVolunteer = await this.prisma.eventVolunteer.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
        status: VolunteerStatus.APPROVED,
      },
    });

    if (!isVolunteer) {
      throw new ForbiddenException(
        'You do not have permission to view attendees for this event',
      );
    }

    return event;
  }

  /**
   * Check if user can view event volunteers
   */
  async validateVolunteerViewPermission(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        name: true,
        organizerId: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check permissions
    if (userRole === SystemRole.SUPER_ADMIN) {
      // Super admin can view volunteers for any event
      return event;
    }

    // Check if user is event organizer (for ADMINs, they can only access events they organized)
    if (event.organizerId === userId) {
      return event;
    }

    // For ADMIN role - they can only access events they organize
    if (userRole === SystemRole.ADMIN) {
      throw new ForbiddenException(
        'You can only view volunteers for events you organize',
      );
    }

    // Check if user is a volunteer for this event
    const isVolunteer = await this.prisma.eventVolunteer.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
        status: VolunteerStatus.APPROVED,
      },
    });

    if (!isVolunteer) {
      throw new ForbiddenException(
        'You do not have permission to view volunteers for this event',
      );
    }

    return event;
  }
}
