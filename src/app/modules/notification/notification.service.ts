import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';
import { Notification, NotificationType } from '@prisma/client';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /**************************************
   * READ OPERATIONS
   **************************************/

  /**
   * Find all notifications for a specific user
   */
  async findAll(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        announcement: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        application: {
          select: {
            id: true,
            status: true,
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find a specific notification by ID
   */
  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        announcement: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        application: {
          select: {
            id: true,
            status: true,
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return { count };
  }

  /**************************************
   * CREATE OPERATIONS
   **************************************/

  /**
   * Create a new notification
   */
  async create(data: CreateNotificationDto): Promise<Notification> {
    return this.prisma.notification.create({
      data,
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Create notification for an event
   */
  async createEventNotification(
    userId: string,
    eventId: string,
    type: NotificationType,
    message: string,
  ): Promise<Notification | null> {
    if (!userId || !eventId || !message) {
      console.error(
        'Cannot create event notification: missing required fields',
      );
      return null;
    }

    try {
      return await this.prisma.notification.create({
        data: {
          type,
          message,
          user: {
            connect: {
              id: userId,
            },
          },
          event: {
            connect: {
              id: eventId,
            },
          },
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Failed to create event notification:', error);
      return null;
    }
  }

  /**
   * Create notification for an announcement
   */
  async createAnnouncementNotification(
    userId: string,
    eventId: string,
    announcementId: string,
    message: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      eventId,
      announcementId,
      type: NotificationType.ANNOUNCEMENT,
      message,
    });
  }

  /**
   * Create notification for volunteer application updates
   */
  async createApplicationNotification(
    userId: string,
    applicationId: string,
    eventId: string,
    message: string,
  ): Promise<Notification | null> {
    if (!userId || !applicationId || !eventId || !message) {
      console.error(
        'Cannot create application notification: missing required fields',
      );
      return null;
    }

    try {
      return await this.prisma.notification.create({
        data: {
          type: NotificationType.APPLICATION_UPDATE,
          message,
          user: {
            connect: {
              id: userId,
            },
          },
          application: {
            connect: {
              id: applicationId,
            },
          },
          event: {
            connect: {
              id: eventId,
            },
          },
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
          application: {
            select: {
              id: true,
              status: true,
              event: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Failed to create application notification:', error);
      return null;
    }
  }

  /**
   * Create a task-related notification
   */
  async createTaskNotification(
    userId: string,
    taskId: string,
    message: string,
  ): Promise<Notification | null> {
    // Validate inputs
    if (!userId) {
      console.error('Cannot create task notification: userId is required');
      throw new Error('User ID is required for task notification');
    }

    if (!taskId) {
      console.error('Cannot create task notification: taskId is required');
      throw new Error('Task ID is required for task notification');
    }

    if (!message) {
      console.error('Cannot create task notification: message is required');
      throw new Error('Message is required for task notification');
    }

    console.log('Creating task notification:', {
      userId,
      taskId,
      message: message.substring(0, 50) + '...',
    });

    try {
      return await this.prisma.notification.create({
        data: {
          type: NotificationType.TASK_ASSIGNMENT,
          message,
          user: {
            connect: {
              id: userId,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Failed to create task notification:', error);
      throw error;
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId: string, limit: number = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        application: {
          select: {
            id: true,
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        announcement: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  /**************************************
   * UPDATE OPERATIONS
   **************************************/

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    await this.findOne(id, userId); // Check if notification exists and belongs to user

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });

    return { count: result.count };
  }

  /**************************************
   * BULK OPERATIONS
   **************************************/

  /**
   * Notify all relevant users about an announcement
   */
  async notifyAllEventUsers(
    eventId: string,
    announcementId: string,
    message: string,
  ): Promise<{ count: number }> {
    // Find all users associated with this event
    const eventUsers = await this.prisma.$transaction([
      // Get attendees
      this.prisma.eventAttendance.findMany({
        where: { eventId },
        select: { userId: true },
      }),
      // Get volunteers
      this.prisma.eventVolunteer.findMany({
        where: { eventId },
        select: { userId: true },
      }),
      // Get interested users
      this.prisma.eventInterest.findMany({
        where: { eventId },
        select: { userId: true },
      }),
    ]);

    // Combine all users and remove duplicates
    const userIds = [...eventUsers[0], ...eventUsers[1], ...eventUsers[2]]
      .map((item) => item.userId)
      .filter((value, index, self) => self.indexOf(value) === index);

    // Create notifications in bulk
    const notifications = userIds.map((userId) => ({
      userId,
      eventId,
      announcementId,
      type: NotificationType.ANNOUNCEMENT,
      message,
    }));

    const result = await this.prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });

    return { count: result.count };
  }
}
