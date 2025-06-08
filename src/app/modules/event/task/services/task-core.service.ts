import { Injectable } from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskPermissionService } from './task-permission.service';
import { TaskNotificationService } from './task-notification.service';

@Injectable()
export class TaskCoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: TaskPermissionService,
    private readonly notificationService: TaskNotificationService,
  ) {}

  /**************************************
   * CREATE OPERATIONS
   **************************************/

  /**
   * Create a new task (Only event organizer, admin, or super admin)
   */
  async create(
    createTaskDto: CreateTaskDto,
    userId: string,
    userRole: SystemRole,
  ) {
    const { eventId, ...taskData } = createTaskDto;

    // Validate permissions and get event
    await this.permissionService.validateTaskCreationPermission(
      eventId,
      userId,
      userRole,
    );

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

  /**************************************
   * UPDATE OPERATIONS
   **************************************/

  /**
   * Update a task (Only event organizer, admin, or super admin)
   */
  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
    userRole: SystemRole,
  ) {
    // Validate permissions
    await this.permissionService.validateTaskModificationPermission(
      id,
      userId,
      userRole,
    );

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
      await this.notificationService.notifyTaskUpdate(updatedTask);
    }

    return updatedTask;
  }

  /**************************************
   * DELETE OPERATIONS
   **************************************/

  /**
   * Delete a task (Only event organizer, admin, or super admin)
   */
  async remove(id: string, userId: string, userRole: SystemRole) {
    // Get task with assignments before deletion
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

    // Validate permissions
    await this.permissionService.validateTaskModificationPermission(
      id,
      userId,
      userRole,
    );

    // Delete task (this will cascade delete assignments)
    await this.prisma.task.delete({
      where: { id },
    });

    // Notify assigned volunteers
    await this.notificationService.notifyTaskCancellation(task);

    return { success: true, message: 'Task deleted successfully' };
  }
}
