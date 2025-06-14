import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SystemRole, VolunteerStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { AssignTaskDto } from '../dto/assign-task.dto';
import { UpdateTaskAssignmentDto } from '../dto/update-task-assignment.dto';
import { TaskNotificationService } from './task-notification.service';
import { TaskPermissionService } from './task-permission.service';

@Injectable()
export class TaskAssignmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: TaskNotificationService,
    private readonly permissionService: TaskPermissionService,
  ) {}

  /**************************************
   * ASSIGNMENT OPERATIONS
   **************************************/

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
    await this.notificationService.notifyTaskAssignment(assignment);

    return assignment;
  }

  /**************************************
   * ASSIGNMENT UPDATE OPERATIONS
   **************************************/

  /**
   * Update task assignment status (volunteers can update their own assignments)
   */
  async updateAssignment(
    assignmentId: string,
    updateDto: UpdateTaskAssignmentDto,
    userId: string,
    userRole: SystemRole,
  ) {
    console.log('🔄 Starting assignment update');
    console.log('Assignment ID:', assignmentId);
    console.log('Update data:', updateDto);
    console.log('User ID:', userId);
    console.log('User role:', userRole);

    // Use centralized permission validation
    const assignment =
      await this.permissionService.validateTaskAssignmentUpdatePermission(
        assignmentId,
        userId,
        userRole,
      );

    console.log('✅ Permission validation passed');

    // Volunteers can only update status, not other fields
    const isVolunteer =
      assignment.volunteerId === userId && userRole === SystemRole.USER;

    let updateData: any = {};

    if (isVolunteer) {
      // Volunteers can only update status (no completedAt field in schema)
      if (updateDto.status) {
        updateData.status = updateDto.status;
      }
    } else {
      // Event organizers/admins can update all allowed fields
      if (updateDto.status) {
        updateData.status = updateDto.status;
      }
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      console.log('⚠️ No valid fields to update');
      throw new BadRequestException('No valid fields provided for update');
    }

    console.log('📝 Update data prepared:', updateData);

    // Update assignment with comprehensive include
    const updatedAssignment = await this.prisma.taskAssignment.update({
      where: { id: assignmentId },
      data: updateData,
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

    console.log('✅ Assignment updated successfully');
    console.log('Updated assignment structure:', {
      hasTask: !!updatedAssignment.task,
      hasEvent: !!updatedAssignment.task?.event,
      hasOrganizer: !!updatedAssignment.task?.event?.organizerId,
      hasVolunteer: !!updatedAssignment.volunteer,
      organizerId: updatedAssignment.task?.event?.organizerId,
      volunteerId: updatedAssignment.volunteerId,
      volunteerName: updatedAssignment.volunteer?.fullName,
      newStatus: updatedAssignment.status,
    });

    // Notify event organizer if volunteer updated the status
    const isAssignedVolunteer = assignment.volunteerId === userId;
    if (isAssignedVolunteer && updateDto.status) {
      console.log('🔔 Triggering status update notification');
      await this.notificationService.notifyAssignmentStatusUpdate(
        updatedAssignment,
      );
    }

    return updatedAssignment;
  }

  /**************************************
   * ASSIGNMENT REMOVAL OPERATIONS
   **************************************/

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
    await this.notificationService.notifyTaskUnassignment(assignment);

    return { success: true, message: 'Assignment removed successfully' };
  }
}
