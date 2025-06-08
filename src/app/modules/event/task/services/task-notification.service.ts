import { Injectable } from '@nestjs/common';
import { NotificationService } from '../../../notification/notification.service';

@Injectable()
export class TaskNotificationService {
  constructor(private readonly notificationService: NotificationService) {}

  /**************************************
   * TASK NOTIFICATIONS
   **************************************/

  /**
   * Notify volunteers about task updates
   */
  async notifyTaskUpdate(task: any) {
    for (const assignment of task.assignments) {
      try {
        await this.notificationService.createTaskNotification(
          assignment.volunteerId,
          task.id,
          `Task "${task.name}" has been updated`,
        );
      } catch (error) {
        console.error('Failed to send task update notification:', error);
      }
    }
  }

  /**
   * Notify volunteers about task cancellation
   */
  async notifyTaskCancellation(task: any) {
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
  }

  /**************************************
   * ASSIGNMENT NOTIFICATIONS
   **************************************/

  /**
   * Notify volunteer about task assignment
   */
  async notifyTaskAssignment(assignment: any) {
    try {
      await this.notificationService.createTaskNotification(
        assignment.volunteerId,
        assignment.task.id,
        `You have been assigned a new task: "${assignment.task.name}" for event "${assignment.task.event.name}"`,
      );
    } catch (error) {
      console.error('Failed to send task assignment notification:', error);
    }
  }

  /**
   * Notify event organizer about assignment status update
   */
  async notifyAssignmentStatusUpdate(assignment: any) {
    try {
      await this.notificationService.createTaskNotification(
        assignment.task.event.organizerId,
        assignment.task.id,
        `${assignment.volunteer.fullName} updated task "${assignment.task.name}" status to ${assignment.status}`,
      );
    } catch (error) {
      console.error('Failed to send task status update notification:', error);
    }
  }

  /**
   * Notify volunteer about task unassignment
   */
  async notifyTaskUnassignment(assignment: any) {
    try {
      await this.notificationService.createTaskNotification(
        assignment.volunteerId,
        assignment.task.id,
        `You have been unassigned from task "${assignment.task.name}"`,
      );
    } catch (error) {
      console.error('Failed to send task unassignment notification:', error);
    }
  }
}
