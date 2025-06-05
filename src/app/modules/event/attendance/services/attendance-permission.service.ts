import { Injectable, NotFoundException } from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';

@Injectable()
export class AttendancePermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user has permission to access the attendance data
   * - Event organizer
   * - Volunteer of the event
   * - Admin/SuperAdmin
   * - Self-registration
   */
  async checkPermission(
    eventId: string,
    userId: string,
    userRole: SystemRole,
    targetUserId?: string,
  ): Promise<boolean> {
    // SuperAdmin always has access
    if (userRole === SystemRole.SUPER_ADMIN) {
      return true;
    }

    // Check if event exists and get organizer
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: { organizerId: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // User is the organizer
    if (event.organizerId === userId) {
      return true;
    }

    // Regular admin has access
    if (userRole === SystemRole.ADMIN) {
      return true;
    }

    // Allow self-registration: user can register themselves
    if (targetUserId && userId === targetUserId) {
      return true;
    }

    // Check if user is a volunteer for this event
    const isVolunteer = await this.prisma.eventVolunteer.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
        status: 'APPROVED',
      },
    });

    return !!isVolunteer;
  }

  /**
   * Validate attendance ownership or admin access
   */
  async validateAttendanceAccess(
    userId: string,
    eventId: string,
    currentUserId: string,
    userRole: SystemRole,
  ): Promise<boolean> {
    const attendance = await this.prisma.eventAttendance.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
      include: {
        event: {
          select: { organizerId: true },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    // Allow user to access their own attendance
    const isSelf = attendance.userId === currentUserId;
    // Allow organizer to access
    const isOrganizer = attendance.event.organizerId === currentUserId;
    // Allow admin/super admin
    const isAdmin =
      userRole === SystemRole.ADMIN || userRole === SystemRole.SUPER_ADMIN;

    return isSelf || isOrganizer || isAdmin;
  }

  /**
   * Check if event exists and is accessible
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

  /**
   * Check if user exists
   */
  async validateUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }
}
