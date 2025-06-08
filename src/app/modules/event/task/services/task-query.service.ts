import { Injectable } from '@nestjs/common';
import { SystemRole, VolunteerStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { TaskQueryDto } from '../dto/task-query.dto';
import { TaskPermissionService } from './task-permission.service';

@Injectable()
export class TaskQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: TaskPermissionService,
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
        // Regular users can only see tasks from events they organize
        where.event = {
          organizerId: userId,
        };
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

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

  /**
   * Get tasks assigned to the current volunteer
   */
  async getMyTasks(userId: string, query: TaskQueryDto) {
    const { status, eventId, search, skip = 0, take = 10 } = query;

    const where: any = {
      volunteerId: userId,
    };

    if (status) {
      where.status = status;
    }

    if (eventId) {
      where.task = {
        eventId,
      };
    }

    if (search) {
      where.task = {
        ...where.task,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [assignments, total] = await Promise.all([
      this.prisma.taskAssignment.findMany({
        where,
        skip: Number(skip),
        take: Number(take),
        orderBy: { task: { dueDate: 'asc' } },
        include: {
          task: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          assignedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
      this.prisma.taskAssignment.count({ where }),
    ]);

    return {
      data: assignments,
      meta: {
        total,
        skip: Number(skip),
        take: Number(take),
        hasMore: Number(skip) + Number(take) < total,
      },
    };
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
   * VOLUNTEER QUERIES
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
}
