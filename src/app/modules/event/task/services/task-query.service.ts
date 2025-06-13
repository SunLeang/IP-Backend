import { Injectable } from '@nestjs/common';
import { SystemRole, VolunteerStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { TaskQueryDto } from '../dto/task-query.dto';
import { TaskPermissionService } from './task-permission.service';
import { TaskVolunteerQueryService } from './task-volunteer-query.service';
import { TaskAssignmentQueryService } from './task-assignment-query.service';

@Injectable()
export class TaskQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: TaskPermissionService,
    private readonly volunteerQueryService: TaskVolunteerQueryService,
    private readonly assignmentQueryService: TaskAssignmentQueryService,
  ) {}

  /**************************************
   * TASK QUERIES
   **************************************/

  /**
   * Get all tasks with filtering and pagination
   */
  async findAll(query: TaskQueryDto, userId: string, userRole: SystemRole) {
    const { status, eventId, volunteerId, search, skip = 0, take = 10 } = query;

    const where: any = {};

    // Build where conditions
    if (status) {
      where.status = status;
    }

    if (eventId) {
      // Check if user has permission to view tasks for this event
      await this.permissionService.validateTaskViewPermission(
        eventId,
        userId,
        userRole,
      );

      where.eventId = eventId;
    } else {
      // If no eventId specified, filter based on user role
      if (userRole === SystemRole.USER) {
        // Get events where user is organizer OR volunteer
        const eventIds = await this.getUserAccessibleEventIds(userId);
        where.eventId = { in: eventIds };
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.getTasksWithPagination(where, skip, take);
  }

  /**
   * Get all tasks for a specific event
   */
  async getEventTasks(
    eventId: string,
    userId: string,
    userRole: SystemRole,
    query: TaskQueryDto,
  ) {
    // Validate permissions
    await this.permissionService.validateTaskViewPermission(
      eventId,
      userId,
      userRole,
    );

    const { status, search, skip = 0, take = 10 } = query;

    const where: any = { eventId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.getTasksWithPagination(where, skip, take);
  }

  /**
   * Get a specific task by ID
   */
  async findOne(id: string, userId: string, userRole: SystemRole) {
    // Validate permissions and get task data
    await this.permissionService.validateTaskViewSinglePermission(
      id,
      userId,
      userRole,
    );

    return this.prisma.task.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            organizerId: true,
          },
        },
        assignments: {
          include: {
            volunteer: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            assignedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });
  }

  /**************************************
   * DELEGATED METHODS
   **************************************/

  /**
   * Get tasks assigned to the current volunteer (Delegated)
   */
  async getMyTasks(userId: string, query: TaskQueryDto) {
    return this.assignmentQueryService.getMyTasks(userId, query);
  }

  /**
   * Get volunteer's tasks for a specific event (Delegated)
   */
  async getMyEventTasks(eventId: string, userId: string, query: TaskQueryDto) {
    return this.assignmentQueryService.getMyEventTasks(eventId, userId, query);
  }

  /**
   * Get volunteers available for task assignment (Delegated)
   */
  async getAvailableVolunteers(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    return this.volunteerQueryService.getAvailableVolunteers(
      eventId,
      userId,
      userRole,
    );
  }

  /**************************************
   * PRIVATE HELPER METHODS
   **************************************/

  private async getUserAccessibleEventIds(userId: string): Promise<string[]> {
    const [organizedEvents, volunteerEvents] = await Promise.all([
      this.prisma.event.findMany({
        where: { organizerId: userId },
        select: { id: true },
      }),
      this.prisma.eventVolunteer.findMany({
        where: {
          userId,
          status: VolunteerStatus.APPROVED,
        },
        select: { eventId: true },
      }),
    ]);

    return [
      ...organizedEvents.map((e) => e.id),
      ...volunteerEvents.map((v) => v.eventId),
    ];
  }

  private async getTasksWithPagination(where: any, skip: number, take: number) {
    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip: Number(skip),
        take: Number(take),
        orderBy: { dueDate: 'asc' },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              organizerId: true,
            },
          },
          assignments: {
            include: {
              volunteer: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
              assignedBy: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        skip: Number(skip),
        take: Number(take),
        hasMore: Number(skip) + Number(take) < total,
      },
    };
  }
}