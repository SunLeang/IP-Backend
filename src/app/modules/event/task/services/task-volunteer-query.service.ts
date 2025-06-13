import { Injectable } from '@nestjs/common';
import { SystemRole, VolunteerStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { TaskPermissionService } from './task-permission.service';

@Injectable()
export class TaskVolunteerQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: TaskPermissionService,
  ) {}

  /**************************************
   * VOLUNTEER QUERY METHODS
   **************************************/

  /**
   * Get volunteers available for task assignment in a specific event
   */
  async getAvailableVolunteers(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    // Validate permissions
    await this.permissionService.validateVolunteerViewPermission(
      eventId,
      userId,
      userRole,
    );

    // Get approved volunteers for this event
    const volunteers = await this.prisma.eventVolunteer.findMany({
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
            age: true,
            org: true,
          },
        },
      },
    });

    return volunteers.map((ev) => ev.user);
  }

  /**
   * Get volunteers assigned to a specific task
   */
  async getTaskVolunteers(taskId: string) {
    return this.prisma.taskAssignment.findMany({
      where: { taskId },
      include: {
        volunteer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            age: true,
            org: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  /**
   * Check if volunteer is available for task assignment
   */
  async isVolunteerAvailable(
    eventId: string,
    volunteerId: string,
  ): Promise<boolean> {
    const volunteer = await this.prisma.eventVolunteer.findUnique({
      where: {
        userId_eventId: {
          userId: volunteerId,
          eventId,
        },
        status: VolunteerStatus.APPROVED,
      },
    });

    return !!volunteer;
  }
}
