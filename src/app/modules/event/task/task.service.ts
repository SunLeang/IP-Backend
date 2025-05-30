import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { UpdateTaskAssignmentDto } from './dto/update-task-assignment.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { SystemRole, TaskStatus, VolunteerStatus } from '@prisma/client';
import { NotificationService } from '../../notification/notification.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a new task (Only event organizer, admin, or super admin)
   */
  async create(
    createTaskDto: CreateTaskDto,
    userId: string,
    userRole: SystemRole,
  ) {
    const { eventId, ...taskData } = createTaskDto;

    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        name: true,
        organizerId: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Authorization check - FIXED LOGIC
    if (userRole === SystemRole.SUPER_ADMIN) {
      // Super admin can create tasks for any event
    } else if (userRole === SystemRole.ADMIN) {
      // Admin can ONLY create tasks for events THEY organized
      if (event.organizerId !== userId) {
        throw new ForbiddenException(
          'You can only create tasks for events you organize',
        );
      }
    } else {
      // Regular users cannot create tasks
      throw new ForbiddenException(
        'You do not have permission to create tasks',
      );
    }

    // Create the task
    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        dueDate: new Date(createTaskDto.dueDate),
        event: { connect: { id: eventId } },
      },
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
          },
        },
      },
    });

    return task;
  }

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
      const event = await this.prisma.event.findUnique({
        where: { id: eventId, deletedAt: null },
        select: { organizerId: true },
      });

      if (!event) {
        throw new NotFoundException(`Event with ID ${eventId} not found`);
      }

      // Only event organizer, admin, or super admin can view all tasks for an event
      if (
        event.organizerId !== userId &&
        userRole !== SystemRole.ADMIN &&
        userRole !== SystemRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          'You do not have permission to view tasks for this event',
        );
      }

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
    const task = await this.prisma.task.findUnique({
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

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Check permissions
    const isEventOrganizer = task.event.organizerId === userId;
    const isAssignedVolunteer = task.assignments.some(
      (assignment) => assignment.volunteerId === userId,
    );

    if (
      !isEventOrganizer &&
      !isAssignedVolunteer &&
      userRole !== SystemRole.ADMIN &&
      userRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this task',
      );
    }

    return task;
  }

  /**
   * Update a task (Only event organizer, admin, or super admin)
   */
  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
    userRole: SystemRole,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            organizerId: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Check permissions
    if (
      task.event.organizerId !== userId &&
      userRole !== SystemRole.ADMIN &&
      userRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this task',
      );
    }

    const updateData: any = { ...updateTaskDto };
    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
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
          },
        },
      },
    });

    // Notify assigned volunteers if task details changed
    if (
      updateTaskDto.name ||
      updateTaskDto.description ||
      updateTaskDto.dueDate
    ) {
      for (const assignment of updatedTask.assignments) {
        try {
          await this.notificationService.createTaskNotification(
            assignment.volunteerId,
            updatedTask.id,
            `Task "${updatedTask.name}" has been updated`,
          );
        } catch (error) {
          console.error('Failed to send task update notification:', error);
        }
      }
    }

    return updatedTask;
  }

  /**
   * Delete a task (Only event organizer, admin, or super admin)
   */
  async remove(id: string, userId: string, userRole: SystemRole) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            organizerId: true,
          },
        },
        assignments: {
          select: {
            volunteerId: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Check permissions
    if (
      task.event.organizerId !== userId &&
      userRole !== SystemRole.ADMIN &&
      userRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this task',
      );
    }

    // Delete task (this will cascade delete assignments)
    await this.prisma.task.delete({
      where: { id },
    });

    // Notify assigned volunteers
    for (const assignment of task.assignments) {
      try {
        await this.notificationService.createTaskNotification(
          assignment.volunteerId,
          task.id,
          `Task "${task.name}" has been cancelled`,
        );
      } catch (error) {
        console.error('Failed to send task cancellation notification:', error);
      }
    }

    return { success: true, message: 'Task deleted successfully' };
  }

  /**
   * Assign a task to a volunteer
   */
  async assignTask(
    taskId: string,
    assignTaskDto: AssignTaskDto,
    userId: string,
    userRole: SystemRole,
  ) {
    const { volunteerId } = assignTaskDto;

    // Get task with event info
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            organizerId: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Check permissions - only event organizer, admin, or super admin
    if (
      task.event.organizerId !== userId &&
      userRole !== SystemRole.ADMIN &&
      userRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to assign this task',
      );
    }

    // Check if volunteer is approved for this event
    const eventVolunteer = await this.prisma.eventVolunteer.findUnique({
      where: {
        userId_eventId: {
          userId: volunteerId,
          eventId: task.event.id,
        },
      },
    });

    if (!eventVolunteer || eventVolunteer.status !== VolunteerStatus.APPROVED) {
      throw new BadRequestException(
        'The volunteer is not approved for this event',
      );
    }

    // Check if task is already assigned to this volunteer
    const existingAssignment = await this.prisma.taskAssignment.findFirst({
      where: {
        taskId,
        volunteerId,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        'Task is already assigned to this volunteer',
      );
    }

    // Create assignment
    const assignment = await this.prisma.taskAssignment.create({
      data: {
        task: { connect: { id: taskId } },
        volunteer: { connect: { id: volunteerId } },
        assignedBy: { connect: { id: userId } },
      },
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
    });

    // Notify the volunteer
    try {
      await this.notificationService.createTaskNotification(
        volunteerId,
        taskId,
        `You have been assigned a new task: "${task.name}" for event "${task.event.name}"`,
      );
    } catch (error) {
      console.error('Failed to send task assignment notification:', error);
    }

    return assignment;
  }

  /**
   * Update task assignment status (Only assigned volunteer can update)
   */
  async updateAssignment(
    assignmentId: string,
    updateDto: UpdateTaskAssignmentDto,
    userId: string,
    userRole: SystemRole,
  ) {
    const assignment = await this.prisma.taskAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        task: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                organizerId: true,
              },
            },
          },
        },
        volunteer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Assignment with ID ${assignmentId} not found`,
      );
    }

    // Check permissions - only assigned volunteer or event organizer/admin
    const isAssignedVolunteer = assignment.volunteerId === userId;
    const isEventOrganizer = assignment.task.event.organizerId === userId;

    if (
      !isAssignedVolunteer &&
      !isEventOrganizer &&
      userRole !== SystemRole.ADMIN &&
      userRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this assignment',
      );
    }

    // Update assignment
    const updatedAssignment = await this.prisma.taskAssignment.update({
      where: { id: assignmentId },
      data: updateDto,
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
        volunteer: {
          select: {
            id: true,
            fullName: true,
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

    // Notify event organizer if volunteer updated the status
    if (isAssignedVolunteer && updateDto.status) {
      try {
        await this.notificationService.createTaskNotification(
          assignment.task.event.organizerId,
          assignment.task.id,
          `${assignment.volunteer.fullName} updated task "${assignment.task.name}" status to ${updateDto.status}`,
        );
      } catch (error) {
        console.error('Failed to send task status update notification:', error);
      }
    }

    return updatedAssignment;
  }

  /**
   * Remove task assignment
   */
  async removeAssignment(
    assignmentId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    const assignment = await this.prisma.taskAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        task: {
          include: {
            event: {
              select: {
                id: true,
                organizerId: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Assignment with ID ${assignmentId} not found`,
      );
    }

    // Check permissions - only event organizer, admin, or super admin
    if (
      assignment.task.event.organizerId !== userId &&
      userRole !== SystemRole.ADMIN &&
      userRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to remove this assignment',
      );
    }

    // Delete assignment
    await this.prisma.taskAssignment.delete({
      where: { id: assignmentId },
    });

    // Notify the volunteer
    try {
      await this.notificationService.createTaskNotification(
        assignment.volunteerId,
        assignment.task.id,
        `You have been unassigned from task "${assignment.task.name}"`,
      );
    } catch (error) {
      console.error('Failed to send task unassignment notification:', error);
    }

    return { success: true, message: 'Assignment removed successfully' };
  }

  /**
   * Get volunteers available for task assignment in a specific event
   */
  async getAvailableVolunteers(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    // Check if event exists and user has permission
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        organizerId: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (
      event.organizerId !== userId &&
      userRole !== SystemRole.ADMIN &&
      userRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to view volunteers for this event',
      );
    }

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
