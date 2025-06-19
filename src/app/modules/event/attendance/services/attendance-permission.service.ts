import { Injectable, NotFoundException } from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';

@Injectable()
export class AttendancePermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ✅ ENHANCED: Check if user has permission to access attendance data
   * Made less restrictive for self-checks
   */
  async checkPermission(
    eventId: string,
    userId: string,
    userRole: SystemRole,
    targetUserId?: string,
  ): Promise<boolean> {
    // ✅ IMPORTANT: If targetUserId is not provided, assume it's a self-check
    // This happens when checking attendance status from event details
    if (!targetUserId) {
      targetUserId = userId; // Default to self-check
    }

    // SuperAdmin always has access
    if (userRole === SystemRole.SUPER_ADMIN) {
      return true;
    }

    // ✅ FIXED: Allow self-checks without further validation
    // Any authenticated user can check their own attendance status
    if (userId === targetUserId) {
      console.log(
        `✅ Allowing self-check for user ${userId} on event ${eventId}`,
      );
      return true;
    }

    // For checking OTHER users' attendance, we need stricter permissions
    console.log(
      `🔒 Checking permissions for user ${userId} to access ${targetUserId}'s attendance on event ${eventId}`,
    );

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
      console.log(`✅ User is event organizer`);
      return true;
    }

    // Regular admin has access
    if (userRole === SystemRole.ADMIN) {
      console.log(`✅ User is admin`);
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
      // ✅ FIXED: EventVolunteer uses composite key, select only existing fields
      select: {
        userId: true,
        eventId: true,
        status: true,
      },
    });

    if (isVolunteer) {
      console.log(`✅ User is approved volunteer`);
      return true;
    }

    console.log(`❌ User has no permission to access other's attendance data`);
    return false;
  }

  /**
   * ✅ NEW: Simplified permission check specifically for self-attendance checks
   * Used when users check their own attendance status
   */
  async checkSelfAttendancePermission(
    eventId: string,
    userId: string,
  ): Promise<boolean> {
    // Any authenticated user can check their own attendance status
    // Just verify the event exists and is accessible
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!event) {
      console.log(`❌ Event ${eventId} not found for self-check`);
      return false;
    }

    console.log(`✅ Self-check allowed for user ${userId} on event ${eventId}`);
    return true;
  }

  /**
   * ✅ FIXED: Validate that an event exists and return the event data
   */
  async validateEventAccess(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        status: true,
        organizerId: true,
        name: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return event; // ✅ Return the event data instead of void
  }

  /**
   * ✅ NEW: Validate that a user exists
   */
  async validateUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  /**
   * Check if user is organizer of an event
   */
  async isEventOrganizer(eventId: string, userId: string): Promise<boolean> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null, organizerId: userId },
      select: { id: true },
    });

    return !!event;
  }

  /**
   * ✅ FIXED: Check if user is an approved volunteer for an event
   */
  async isEventVolunteer(eventId: string, userId: string): Promise<boolean> {
    const volunteer = await this.prisma.eventVolunteer.findUnique({
      where: {
        userId_eventId: { userId, eventId },
        status: 'APPROVED',
      },
      // ✅ FIXED: Use valid fields for EventVolunteer
      select: {
        userId: true,
        eventId: true,
        status: true,
      },
    });

    return !!volunteer;
  }
}
