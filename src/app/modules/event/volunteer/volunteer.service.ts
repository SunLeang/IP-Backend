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
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    // Only event organizer, admin, or super admin can update status
    if (
      application.event.organizerId !== userId &&
      userRole === SystemRole.USER
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this application',
      );
    }

    // Make sure we can only transition from PENDING to APPROVED/REJECTED
    if (application.status !== ApplicationStatus.PENDING) {
      throw new ForbiddenException(
        `Cannot update application that is already ${application.status}`,
      );
    }

    // Update the application status
    const updatedApplication = await this.prisma.volunteerApplication.update({
      where: { id },
      data: {
        status: updateDto.status,
        processedAt: new Date(),
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
          },
        },
      },
    });

    // If application is approved, update the user's currentRole and create EventVolunteer entry
    if (updateDto.status === ApplicationStatus.APPROVED) {
      // Update user's currentRole to VOLUNTEER
      await this.prisma.user.update({
        where: { id: application.userId },
        data: { currentRole: CurrentRole.VOLUNTEER },
      });

      // Create or update EventVolunteer record
      await this.prisma.eventVolunteer.upsert({
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

      // Notify the applicant
      await this.notificationService.createApplicationNotification(
        application.userId,
        application.id,
        application.eventId,
        `Your volunteer application for "${application.event.name}" has been approved!`,
      );
    } else if (updateDto.status === ApplicationStatus.REJECTED) {
      // Notify the applicant
      await this.notificationService.createApplicationNotification(
        application.userId,
        application.id,
        application.eventId,
        `Your volunteer application for "${application.event.name}" has been declined.`,
      );
    }

    return updatedApplication;
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
}
