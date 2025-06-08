import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, SystemRole, VolunteerStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { VolunteerPermissionService } from './volunteer-permission.service';

@Injectable()
export class VolunteerQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: VolunteerPermissionService,
  ) {}

  /**************************************
   * APPLICATION QUERIES
   **************************************/

  /**
   * Get all applications for a specific event
   */
  async getEventApplications(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    // Validate permissions
    await this.permissionService.validateEventApplicationsAccess(
      eventId,
      userId,
      userRole,
    );

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

  /**
   * Get all applications for a user
   */
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

  /**
   * Get application by ID
   */
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

    // Validate access permissions
    await this.permissionService.validateApplicationViewAccess(
      application,
      userId,
      userRole,
    );

    return application;
  }

  /**************************************
   * VOLUNTEER QUERIES
   **************************************/

  /**
   * Get all volunteers for an event
   */
  async getEventVolunteers(eventId: string) {
    const event = await this.permissionService.validateEventAccess(eventId);

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

  /**************************************
   * HELPER QUERIES
   **************************************/

  /**
   * Check if a user has an approved application
   */
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
}
