import { Injectable } from '@nestjs/common';
import { VolunteerStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { TaskQueryDto } from '../dto/task-query.dto';

@Injectable()
export class TaskAssignmentQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**************************************
   * ASSIGNMENT QUERY METHODS
   **************************************/

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
   * Get volunteer's tasks for a specific event
   */
  async getMyEventTasks(eventId: string, userId: string, query: TaskQueryDto) {
    // Check if user is a volunteer for this event
    const isVolunteer = await this.prisma.eventVolunteer.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
        status: VolunteerStatus.APPROVED,
      },
    });

    if (!isVolunteer) {
      return {
        data: [],
        meta: {
          total: 0,
          skip: 0,
          take: 10,
          hasMore: false,
        },
      };
    }

    const { status, search, skip = 0, take = 10 } = query;

    const where: any = {
      volunteerId: userId,
      task: {
        eventId,
      },
    };

    if (status) {
      where.status = status;
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
}
