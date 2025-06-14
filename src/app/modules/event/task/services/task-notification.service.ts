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
    try {
      if (!task.assignments || task.assignments.length === 0) {
        console.log('No assignments found for task update notification');
        return;
      }

      for (const assignment of task.assignments) {
        if (!assignment.volunteerId) {
          console.log('Assignment missing volunteerId, skipping notification');
          continue;
        }

        try {
          await this.notificationService.createTaskNotification(
            assignment.volunteerId,
            task.id,
            `Task "${task.name}" has been updated`,
          );
        } catch (error) {
          console.error(
            `Failed to send task update notification to ${assignment.volunteerId}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error('Error in notifyTaskUpdate:', error);
    }
  }

  /**
   * Notify volunteers about task cancellation
   */
  async notifyTaskCancellation(task: any) {
    try {
      if (!task.assignments || task.assignments.length === 0) {
        console.log('No assignments found for task cancellation notification');
        return;
      }

      for (const assignment of task.assignments) {
        if (!assignment.volunteerId) {
          console.log('Assignment missing volunteerId, skipping notification');
          continue;
        }

        try {
          await this.notificationService.createTaskNotification(
            assignment.volunteerId,
            task.id,
            `Task "${task.name}" has been cancelled`,
          );
        } catch (error) {
          console.error(
            `Failed to send task cancellation notification to ${assignment.volunteerId}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error('Error in notifyTaskCancellation:', error);
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
      if (!assignment.volunteerId) {
        console.log(
          'Assignment missing volunteerId, skipping assignment notification',
        );
        return;
      }

      if (!assignment.task?.id) {
        console.log(
          'Assignment missing task ID, skipping assignment notification',
        );
        return;
      }

      const eventName = assignment.task?.event?.name || 'Unknown Event';
      const taskName = assignment.task?.name || 'Unknown Task';

      await this.notificationService.createTaskNotification(
        assignment.volunteerId,
        assignment.task.id,
        `You have been assigned a new task: "${taskName}" for event "${eventName}"`,
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
      console.log('🔔 Starting assignment status update notification');
      console.log('Assignment data:', {
        hasTask: !!assignment.task,
        hasEvent: !!assignment.task?.event,
        hasOrganizer: !!assignment.task?.event?.organizerId,
        hasVolunteer: !!assignment.volunteer,
        organizerId: assignment.task?.event?.organizerId,
        volunteerId: assignment.volunteerId,
        status: assignment.status,
      });

      // Validate required data
      if (!assignment.task?.event?.organizerId) {
        console.log(
          '❌ Assignment missing event organizer ID, skipping notification',
        );
        return;
      }

      if (!assignment.task?.id) {
        console.log('❌ Assignment missing task ID, skipping notification');
        return;
      }

      if (!assignment.volunteer?.fullName && !assignment.volunteerId) {
        console.log(
          '❌ Assignment missing volunteer information, skipping notification',
        );
        return;
      }

      const organizerId = assignment.task.event.organizerId;
      const taskId = assignment.task.id;
      const taskName = assignment.task.name || 'Unknown Task';
      const volunteerName =
        assignment.volunteer?.fullName || 'Unknown Volunteer';
      const status = assignment.status || 'Unknown Status';

      const message = `${volunteerName} updated task "${taskName}" status to ${status}`;

      console.log('✅ Sending notification to organizer:', {
        organizerId,
        taskId,
        message,
      });

      await this.notificationService.createTaskNotification(
        organizerId,
        taskId,
        message,
      );

      console.log('✅ Assignment status update notification sent successfully');
    } catch (error) {
      console.error(
        '❌ Failed to send task status update notification:',
        error,
      );
    }
  }

  /**
   * Notify volunteer about task unassignment
   */
  async notifyTaskUnassignment(assignment: any) {
    try {
      if (!assignment.volunteerId) {
        console.log(
          'Assignment missing volunteerId, skipping unassignment notification',
        );
        return;
      }

      if (!assignment.task?.id) {
        console.log(
          'Assignment missing task ID, skipping unassignment notification',
        );
        return;
      }

      const taskName = assignment.task?.name || 'Unknown Task';

      await this.notificationService.createTaskNotification(
        assignment.volunteerId,
        assignment.task.id,
        `You have been unassigned from task "${taskName}"`,
      );
    } catch (error) {
      console.error('Failed to send task unassignment notification:', error);
    }
  }
}
