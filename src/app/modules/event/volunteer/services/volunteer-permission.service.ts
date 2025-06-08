import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';

@Injectable()
export class VolunteerPermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**************************************
   * EVENT VALIDATION
   **************************************/

  /**
   * Check if event exists and validate access
   */
  async validateEventAccess(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return event;
  }

  /**************************************
   * APPLICATION ACCESS VALIDATION
   **************************************/

  /**
   * Check if user can view event applications
   */
  async validateEventApplicationsAccess(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    const event = await this.validateEventAccess(eventId);

    // Authorization check - CORRECTED LOGIC
    if (userRole === SystemRole.SUPER_ADMIN) {
      // Super admin can view applications for any event
    } else if (userRole === SystemRole.ADMIN) {
      // Admin can only view applications for events they organized
      if (event.organizerId !== userId) {
        throw new ForbiddenException(
          'You can only view volunteer applications for events you organize',
        );
      }
    } else {
      // Regular users cannot view event applications
      throw new ForbiddenException(
        'You do not have permission to view these applications',
      );
    }

    return event;
  }

  /**
   * Check if user can view specific application
   */
  async validateApplicationViewAccess(
    application: any,
    userId: string,
    userRole: SystemRole,
  ) {
    // Only the applicant, event organizer, admin, or super admin can view the application
    if (
      application.userId !== userId &&
      application.event.organizerId !== userId &&
      userRole === SystemRole.USER
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this application',
      );
    }
  }

  /**
   * Check if user can update application status
   */
  async validateApplicationUpdateAccess(
    application: any,
    userId: string,
    userRole: SystemRole,
  ) {
    // Authorization check - CORRECTED LOGIC
    if (userRole === SystemRole.SUPER_ADMIN) {
      // Super admin can modify any application
    } else if (userRole === SystemRole.ADMIN) {
      // Admin can only modify applications for events they organized
      if (application.event.organizerId !== userId) {
        throw new ForbiddenException(
          'You can only update volunteer applications for events you organize',
        );
      }
    } else {
      // Regular users cannot modify applications
      throw new ForbiddenException(
        'You do not have permission to update volunteer applications',
      );
    }
  }

  /**************************************
   * VOLUNTEER MANAGEMENT VALIDATION
   **************************************/

  /**
   * Check if user can remove volunteers from event
   */
  async validateVolunteerRemovalAccess(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    const event = await this.validateEventAccess(eventId);

    // Authorization check - CORRECTED LOGIC
    if (userRole === SystemRole.SUPER_ADMIN) {
      // Super admin can remove volunteers from any event
    } else if (userRole === SystemRole.ADMIN) {
      // Admin can only remove volunteers from events they organized
      if (event.organizerId !== userId) {
        throw new ForbiddenException(
          'You can only remove volunteers from events you organize',
        );
      }
    } else {
      // Regular users cannot remove volunteers
      throw new ForbiddenException(
        'You do not have permission to remove volunteers',
      );
    }

    return event;
  }
}
