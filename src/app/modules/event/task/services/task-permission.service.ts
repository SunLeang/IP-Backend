import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SystemRole, VolunteerStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';

@Injectable()
export class TaskPermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**************************************
   * EVENT VALIDATION
   **************************************/

  /**
   * Check if event exists and validate access
   */
  async validateEventAccess(eventId: string) {
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

    return event;
  }

  /**************************************
   * TASK AUTHORIZATION
   **************************************/

  /**
   * Check if user can create tasks for an event
   */
  async validateTaskCreationPermission(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    const event = await this.validateEventAccess(eventId);

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

    return event;
  }

  /**
   * Check if user can view tasks for an event
   */
  async validateTaskViewPermission(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    const event = await this.validateEventAccess(eventId);

    // Check if user is event organizer, admin, or super admin
    if (
      event.organizerId === userId ||
      userRole === SystemRole.ADMIN ||
      userRole === SystemRole.SUPER_ADMIN
    ) {
      return event;
    }

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
      throw new ForbiddenException(
        'You do not have permission to view tasks for this event',
      );
    }

    return event;
  }

  /**
   * Check if user can modify (update/delete) a task
   */
  async validateTaskModificationPermission(
    taskId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
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
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Check permissions
    if (
      task.event.organizerId !== userId &&
      userRole !== SystemRole.ADMIN &&
      userRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to modify this task',
      );
    }

    return task;
  }

  /**
   * Check if user can view a specific task
   */
  async validateTaskViewSinglePermission(
    taskId: string,
    userId: string,
    userRole: SystemRole,
  ) {
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
        assignments: {
          select: {
            volunteerId: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Check permissions
    const isEventOrganizer = task.event.organizerId === userId;
    const isAssignedVolunteer = task.assignments.some(
      (assignment) => assignment.volunteerId === userId,
    );

    if (
      isEventOrganizer ||
      isAssignedVolunteer ||
      userRole === SystemRole.ADMIN ||
      userRole === SystemRole.SUPER_ADMIN
    ) {
      return task;
    }

    // Check if user is a volunteer for this event (even if not assigned to this specific task)
    const isVolunteer = await this.prisma.eventVolunteer.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId: task.event.id,
        },
        status: VolunteerStatus.APPROVED,
      },
    });

    if (!isVolunteer) {
      throw new ForbiddenException(
        'You do not have permission to view this task',
      );
    }

    return task;
  }

  /**
   * Check if user can update task assignment (volunteers can update their own assignments)
   */
  async validateTaskAssignmentUpdatePermission(
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

    // Check permissions
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

    return assignment;
  }

  /**************************************
   * VOLUNTEER ACCESS VALIDATION
   **************************************/

  /**
   * Check if user can view volunteers for an event
   */
  async validateVolunteerViewPermission(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    const event = await this.validateEventAccess(eventId);

    if (
      event.organizerId !== userId &&
      userRole !== SystemRole.ADMIN &&
      userRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to view volunteers for this event',
      );
    }

    return event;
  }
}
