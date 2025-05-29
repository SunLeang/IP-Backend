// src/app/modules/volunteer/volunteer.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { CreateVolunteerApplicationDto } from './dto/create-volunteer-application.dto';
import { UpdateVolunteerApplicationDto } from './dto/update-volunteer-application.dto';
import {
  ApplicationStatus,
  CurrentRole,
  SystemRole,
  VolunteerStatus,
  EventStatus,
  AttendanceStatus,
} from '@prisma/client';
import { NotificationService } from '../../notification/notification.service';

@Injectable()
export class VolunteerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // Create a volunteer application
  async createApplication(
    userId: string,
    createDto: CreateVolunteerApplicationDto,
  ) {
    // Ensure only ATTENDEEs can apply
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentRole: true },
    });

    // Check if user exists
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if user has the correct role
    if (user.currentRole !== CurrentRole.ATTENDEE) {
      throw new ForbiddenException(
        'Only users with ATTENDEE role can apply for volunteer positions',
      );
    }

    // Check if event exists, is published, and is accepting volunteers
    const event = await this.prisma.event.findUnique({
      where: {
        id: createDto.eventId,
        status: EventStatus.PUBLISHED,
        acceptingVolunteers: true, // Only allow applications if this flag is true
        deletedAt: null,
      },
    });

    if (!event) {
      throw new ForbiddenException(
        `Cannot apply to event with ID ${createDto.eventId}. Event may not exist, is not published, or is not accepting volunteers.`,
      );
    }

    // Check if user already applied for this event
    const existingApplication =
      await this.prisma.volunteerApplication.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId: createDto.eventId,
          },
        },
      });

    if (existingApplication) {
      throw new ConflictException(
        'You have already applied to volunteer for this event',
      );
    }

    // Create application
    const application = await this.prisma.volunteerApplication.create({
      data: {
        whyVolunteer: createDto.whyVolunteer,
        cvPath: createDto.cvPath,
        user: { connect: { id: userId } },
        event: { connect: { id: createDto.eventId } },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            organizerId: true,
          },
        },
      },
    });

    // Notify event organizer
    await this.notificationService.createApplicationNotification(
      event.organizerId, // Send to event organizer
      application.id,
      event.id,
      `New volunteer application from ${application.user.fullName}`,
    );

    return application;
  }

  // Get all applications for a specific event
  async getEventApplications(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Only event organizer, admin, or super admin can see all applications
    if (event.organizerId !== userId && userRole === SystemRole.USER) {
      throw new ForbiddenException(
        'You do not have permission to view these applications',
      );
    }

    return this.prisma.volunteerApplication.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            gender: true,
            age: true,
            org: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  // Get all applications for a user
  async getUserApplications(userId: string) {
    return this.prisma.volunteerApplication.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            dateTime: true,
            status: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  // Get application by ID
  async getApplicationById(id: string, userId: string, userRole: SystemRole) {
    const application = await this.prisma.volunteerApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            gender: true,
            age: true,
            org: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            dateTime: true,
            organizerId: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

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

    return application;
  }

  // Update application status (approve or reject)
  async updateApplicationStatus(
    id: string,
    updateDto: UpdateVolunteerApplicationDto,
    userId: string,
    userRole: SystemRole,
  ) {
    const application = await this.prisma.volunteerApplication.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            organizerId: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            currentRole: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Authorization check
    if (
      application.event.organizerId !== userId &&
      userRole !== SystemRole.ADMIN &&
      userRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this application',
      );
    }

    return await this.prisma.$transaction(async (prisma) => {
      // Update the application
      const updatedApplication = await prisma.volunteerApplication.update({
        where: { id },
        data: {
          status: updateDto.status,
          processedAt: new Date(),
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              currentRole: true,
            },
          },
        },
      });

      if (updateDto.status === ApplicationStatus.APPROVED) {
        // Create EventVolunteer record
        await prisma.eventVolunteer.upsert({
          where: {
            userId_eventId: {
              userId: application.userId,
              eventId: application.eventId,
            },
          },
          update: {
            status: VolunteerStatus.APPROVED,
            approvedAt: new Date(),
          },
          create: {
            userId: application.userId,
            eventId: application.eventId,
            status: VolunteerStatus.APPROVED,
            approvedAt: new Date(),
          },
        });

        // Update user role
        await prisma.user.update({
          where: { id: application.userId },
          data: { currentRole: CurrentRole.VOLUNTEER },
        });
      } else if (updateDto.status === ApplicationStatus.REJECTED) {
        // Remove EventVolunteer record if exists
        await prisma.eventVolunteer.deleteMany({
          where: {
            userId: application.userId,
            eventId: application.eventId,
          },
        });

        // Check if user has other volunteer roles
        const otherVolunteerRoles = await prisma.eventVolunteer.count({
          where: {
            userId: application.userId,
            eventId: { not: application.eventId },
            status: VolunteerStatus.APPROVED,
          },
        });

        // If no other volunteer roles, change back to ATTENDEE
        if (otherVolunteerRoles === 0) {
          await prisma.user.update({
            where: { id: application.userId },
            data: { currentRole: CurrentRole.ATTENDEE },
          });
        }
      }

      return updatedApplication;
    });
  }

  // Get all volunteers for an event
  async getEventVolunteers(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return this.prisma.eventVolunteer.findMany({
      where: {
        eventId,
        status: VolunteerStatus.APPROVED,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            gender: true,
            org: true,
          },
        },
      },
    });
  }

  // Remove a volunteer from an event
  async removeVolunteer(
    eventId: string,
    volunteerId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Only event organizer, admin, or super admin can remove volunteers
    if (event.organizerId !== userId && userRole === SystemRole.USER) {
      throw new ForbiddenException(
        'You do not have permission to remove volunteers',
      );
    }

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
    await this.notificationService.createEventNotification(
      volunteerId,
      eventId,
      'APPLICATION_UPDATE',
      `You have been removed as a volunteer for "${event.name}".`,
    );

    return { success: true };
  }

  // Check if a user has an approved application
  async hasApprovedApplication(userId: string): Promise<boolean> {
    const approvedApplicationCount =
      await this.prisma.volunteerApplication.count({
        where: {
          userId,
          status: ApplicationStatus.APPROVED,
        },
      });

    return approvedApplicationCount > 0;
  }

  // Get dashboard statistics for a user
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
