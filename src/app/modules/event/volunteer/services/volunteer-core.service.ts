import { Injectable } from '@nestjs/common';
import {
  SystemRole,
  VolunteerStatus,
  CurrentRole,
  AttendanceStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { VolunteerPermissionService } from './volunteer-permission.service';
import { VolunteerNotificationService } from './volunteer-notification.service';

@Injectable()
export class VolunteerCoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: VolunteerPermissionService,
    private readonly notificationService: VolunteerNotificationService,
  ) {}

  /**************************************
   * VOLUNTEER MANAGEMENT
   **************************************/

  /**
   * Remove a volunteer from an event
   */
  async removeVolunteer(
    eventId: string,
    volunteerId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    // Validate permissions and get event
    const event = await this.permissionService.validateVolunteerRemovalAccess(
      eventId,
      userId,
      userRole,
    );

    // Update EventVolunteer status
    await this.prisma.eventVolunteer.update({
      where: {
        userId_eventId: {
          userId: volunteerId,
          eventId,
        },
      },
      data: {
        status: VolunteerStatus.REMOVED,
        approvedAt: null,
      },
    });

    // Check if user is volunteering for other events
    const otherActiveVolunteerRoles = await this.prisma.eventVolunteer.count({
      where: {
        userId: volunteerId,
        eventId: { not: eventId },
        status: VolunteerStatus.APPROVED,
      },
    });

    // If this was their only volunteer role, change currentRole back to ATTENDEE
    if (otherActiveVolunteerRoles === 0) {
      await this.prisma.user.update({
        where: { id: volunteerId },
        data: { currentRole: CurrentRole.ATTENDEE },
      });
    }

    // Notify the volunteer
    await this.notificationService.notifyVolunteerRemoval(
      volunteerId,
      eventId,
      event.name,
    );

    return { success: true };
  }

  /**************************************
   * DASHBOARD STATISTICS
   **************************************/

  /**
   * Get dashboard statistics for a user
   */
  async getDashboardStats(userId: string) {
    console.log('=== Getting Dashboard Stats ===');
    console.log('User ID:', userId);

    // Get all events where the user is a volunteer
    const volunteerEvents = await this.prisma.eventVolunteer.findMany({
      where: {
        userId,
        status: VolunteerStatus.APPROVED,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            status: true,
            _count: {
              select: {
                attendingUsers: {
                  where: {
                    status: AttendanceStatus.JOINED,
                  },
                },
                volunteers: {
                  where: {
                    status: VolunteerStatus.APPROVED,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`Found ${volunteerEvents.length} volunteer events for user`);

    // Get all tasks assigned to this volunteer across all events
    const taskCount = await this.prisma.taskAssignment.count({
      where: {
        volunteerId: userId,
      },
    });

    console.log(`Found ${taskCount} tasks assigned to volunteer`);

    // If no tasks found, let's also check if there are any tasks for events this user volunteers for
    if (taskCount === 0) {
      console.log('No direct task assignments found. Checking event tasks...');

      const eventIds = volunteerEvents.map((ve) => ve.eventId);
      const availableTasksCount = await this.prisma.task.count({
        where: {
          eventId: { in: eventIds },
        },
      });

      console.log(
        `Found ${availableTasksCount} total tasks for volunteer events`,
      );
    }

    // Calculate total attendees across all volunteer events
    let totalAttendees = 0;

    // Format event data for dashboard
    const events = volunteerEvents.map((ve) => {
      const attendeeCount = ve.event._count.attendingUsers;
      const volunteerCount = ve.event._count.volunteers;
      totalAttendees += attendeeCount;

      // Calculate capacity as 20% more than current attendees (or use actual capacity if available)
      const attendeeCapacity = Math.max(
        attendeeCount + 10,
        Math.ceil(attendeeCount * 1.2),
      );

      return {
        id: parseInt(ve.event.id.substring(0, 8), 16), // Convert UUID to number for frontend
        name: ve.event.name,
        attendeeCount,
        attendeeCapacity,
        volunteerCount: `${volunteerCount}/20`, // Format as "current/total"
        progress: Math.min(
          100,
          Math.round((attendeeCount / attendeeCapacity) * 100),
        ),
      };
    });

    // Get total volunteers across all events this user volunteers for
    const totalVolunteers = await this.prisma.eventVolunteer.count({
      where: {
        eventId: { in: volunteerEvents.map((ve) => ve.eventId) },
        status: VolunteerStatus.APPROVED,
      },
    });

    const result = {
      attendeeCount: totalAttendees,
      taskCount,
      volunteerCount: totalVolunteers,
      events,
    };

    console.log('Dashboard stats result:', result);
    return result;
  }
}
