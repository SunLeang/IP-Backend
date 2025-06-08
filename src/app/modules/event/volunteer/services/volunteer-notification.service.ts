import { Injectable } from '@nestjs/common';
import { NotificationService } from '../../../notification/notification.service';

@Injectable()
export class VolunteerNotificationService {
  constructor(private readonly notificationService: NotificationService) {}

  /**************************************
   * APPLICATION NOTIFICATIONS
   **************************************/

  /**
   * Notify event organizer about new application
   */
  async notifyApplicationSubmitted(application: any, event: any) {
    try {
      await this.notificationService.createApplicationNotification(
        event.organizerId, // Send to event organizer
        application.id,
        event.id,
        `New volunteer application from ${application.user.fullName}`,
      );
    } catch (error) {
      console.error('Failed to send application notification:', error);
    }
  }

  /**************************************
   * VOLUNTEER MANAGEMENT NOTIFICATIONS
   **************************************/

  /**
   * Notify volunteer about removal from event
   */
  async notifyVolunteerRemoval(
    volunteerId: string,
    eventId: string,
    eventName: string,
  ) {
    try {
      await this.notificationService.createEventNotification(
        volunteerId,
        eventId,
        'APPLICATION_UPDATE',
        `You have been removed as a volunteer for "${eventName}".`,
      );
    } catch (error) {
      console.error('Failed to send volunteer removal notification:', error);
    }
  }
}
