  /*******************************************
   * Create & Update Volunteer Applications  *
   ******************************************/
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  CurrentRole,
  SystemRole,
  VolunteerStatus,
  EventStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { CreateVolunteerApplicationDto } from '../dto/create-volunteer-application.dto';
import { UpdateVolunteerApplicationDto } from '../dto/update-volunteer-application.dto';
import { VolunteerPermissionService } from './volunteer-permission.service';
import { VolunteerNotificationService } from './volunteer-notification.service';

@Injectable()
export class VolunteerApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: VolunteerPermissionService,
    private readonly notificationService: VolunteerNotificationService,
  ) {}

  /**************************************
   * APPLICATION CREATION
   **************************************/

  /**
   * Create a volunteer application
   */
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
    await this.notificationService.notifyApplicationSubmitted(
      application,
      event,
    );

    return application;
  }

  /**************************************
   * APPLICATION STATUS UPDATE
   **************************************/

  /**
   * Update application status (approve or reject)
   */
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

    // Validate permissions
    await this.permissionService.validateApplicationUpdateAccess(
      application,
      userId,
      userRole,
    );

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
}
