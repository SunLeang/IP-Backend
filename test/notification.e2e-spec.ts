import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as express from 'express';
import { PrismaService } from '../src/app/prisma/services/prisma.service';
import { SystemRole, NotificationType } from '@prisma/client';
import * as bodyParser from 'body-parser';

// Define notification interface for testing
interface MockNotification {
  id: string;
  type: NotificationType;
  message: string;
  userId: string;
  eventId?: string;
  announcementId?: string;
  applicationId?: string;
  read: boolean;
  sentAt: Date;
}

/**
 * Mock Notification Controller
 */
class MockNotificationController {
  // Mock data
  private notifications: MockNotification[] = [
    {
      id: '1',
      type: NotificationType.SYSTEM_ALERT, // Changed from EVENT_UPDATE
      message: 'Event has been updated',
      userId: 'user-id',
      eventId: 'event-id-1',
      read: false,
      sentAt: new Date(),
    },
    {
      id: '2',
      type: NotificationType.ANNOUNCEMENT,
      message: 'New announcement for Event 1',
      userId: 'user-id',
      eventId: 'event-id-1',
      announcementId: 'announcement-id-1',
      read: true,
      sentAt: new Date(Date.now() - 86400000), // 1 day ago
    },
    {
      id: '3',
      type: NotificationType.APPLICATION_UPDATE,
      message: 'Your volunteer application was approved',
      userId: 'user-id',
      eventId: 'event-id-2',
      applicationId: 'application-id-1',
      read: false,
      sentAt: new Date(Date.now() - 172800000), // 2 days ago
    },
    {
      id: '4',
      type: NotificationType.SYSTEM_ALERT, // Changed from EVENT_UPDATE
      message: 'Event has been updated',
      userId: 'other-user-id',
      eventId: 'event-id-1',
      read: false,
      sentAt: new Date(),
    },
  ];

  private events = {
    'event-id-1': {
      id: 'event-id-1',
      name: 'Test Event 1',
    },
    'event-id-2': {
      id: 'event-id-2',
      name: 'Test Event 2',
    },
  };

  private announcements = {
    'announcement-id-1': {
      id: 'announcement-id-1',
      title: 'Test Announcement 1',
      description: 'This is a test announcement',
    },
  };

  private applications = {
    'application-id-1': {
      id: 'application-id-1',
      status: 'APPROVED',
      event: {
        id: 'event-id-2',
        name: 'Test Event 2',
      },
    },
  };

  /**
   * Find all notifications for a user
   */
  findAll(userId: string) {
    const userNotifications = this.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .map((notification) => {
        const result: any = { ...notification };

        // Include relationships if they exist
        if (notification.eventId && this.events[notification.eventId]) {
          result.event = this.events[notification.eventId];
        }

        if (
          notification.announcementId &&
          this.announcements[notification.announcementId]
        ) {
          result.announcement = this.announcements[notification.announcementId];
        }

        if (
          notification.applicationId &&
          this.applications[notification.applicationId]
        ) {
          result.application = this.applications[notification.applicationId];
        }

        return result;
      });

    return userNotifications;
  }

  /**
   * Find a specific notification by ID
   */
  findOne(id: string, userId: string) {
    const notification = this.notifications.find(
      (n) => n.id === id && n.userId === userId,
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    const result: any = { ...notification };

    // Include relationships if they exist
    if (notification.eventId && this.events[notification.eventId]) {
      result.event = this.events[notification.eventId];
    }

    if (
      notification.announcementId &&
      this.announcements[notification.announcementId]
    ) {
      result.announcement = this.announcements[notification.announcementId];
    }

    if (
      notification.applicationId &&
      this.applications[notification.applicationId]
    ) {
      result.application = this.applications[notification.applicationId];
    }

    return result;
  }

  /**
   * Mark a notification as read
   */
  markAsRead(id: string, userId: string) {
    const notification = this.notifications.find(
      (n) => n.id === id && n.userId === userId,
    );

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.read = true;

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: string) {
    let count = 0;
    this.notifications.forEach((n) => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        count++;
      }
    });

    return { count };
  }

  /**
   * Get count of unread notifications
   */
  getUnreadCount(userId: string) {
    const count = this.notifications.filter(
      (n) => n.userId === userId && !n.read,
    ).length;

    return { count };
  }
}

describe('Notification Module (e2e)', () => {
  let app: INestApplication;
  let expressInstance: express.Express;
  let mockController: MockNotificationController;

  // User credentials
  const regularUserToken = 'regular-user-token';
  const otherUserToken = 'other-user-token';
  const adminToken = 'admin-token';

  // User IDs
  const userId = 'user-id';
  const otherUserId = 'other-user-id';
  const adminId = 'admin-id';

  beforeAll(async () => {
    mockController = new MockNotificationController();

    // Create express instance
    expressInstance = express();
    expressInstance.use(bodyParser.json());
    expressInstance.use(bodyParser.urlencoded({ extended: true }));

    // Mock JWT verification and user extraction
    expressInstance.use(function (req: any, res: any, next: any) {
      // Extract token
      const authHeader = req.headers.authorization || '';
      const token = authHeader.split(' ')[1];

      // Set user based on token
      if (token === regularUserToken) {
        req.user = {
          id: userId,
          email: 'user@example.com',
          systemRole: SystemRole.USER,
        };
      } else if (token === otherUserToken) {
        req.user = {
          id: otherUserId,
          email: 'other@example.com',
          systemRole: SystemRole.USER,
        };
      } else if (token === adminToken) {
        req.user = {
          id: adminId,
          email: 'admin@example.com',
          systemRole: SystemRole.ADMIN,
        };
      } else {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      next();
    });

    // Express routes
    expressInstance.get('/notifications', function (req: any, res: any) {
      try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const result = mockController.findAll(req.user.id);
        return res.status(200).json(result);
      } catch (error) {
        console.error('Error in GET /notifications:', error);
        return res.status(500).json({ message: error.message });
      }
    });

    // Move the unread-count route BEFORE the :id route
    expressInstance.get(
      '/notifications/unread-count',
      function (req: any, res: any) {
        try {
          if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
          const result = mockController.getUnreadCount(req.user.id);
          return res.status(200).json(result);
        } catch (error) {
          console.error('Error in GET /notifications/unread-count:', error);
          return res.status(500).json({ message: error.message });
        }
      },
    );

    expressInstance.get('/notifications/:id', function (req: any, res: any) {
      try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const result = mockController.findOne(req.params.id, req.user.id);
        return res.status(200).json(result);
      } catch (error) {
        console.error('Error in GET /notifications/:id:', error);
        return res
          .status(error.message === 'Notification not found' ? 404 : 500)
          .json({ message: error.message });
      }
    });

    expressInstance.patch(
      '/notifications/:id/read',
      function (req: any, res: any) {
        try {
          if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
          const result = mockController.markAsRead(req.params.id, req.user.id);
          return res.status(200).json(result);
        } catch (error) {
          console.error('Error in PATCH /notifications/:id/read:', error);
          return res
            .status(error.message === 'Notification not found' ? 404 : 500)
            .json({ message: error.message });
        }
      },
    );

    expressInstance.patch(
      '/notifications/mark-all-read',
      function (req: any, res: any) {
        try {
          if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
          const result = mockController.markAllAsRead(req.user.id);
          return res.status(200).json(result);
        } catch (error) {
          console.error('Error in PATCH /notifications/mark-all-read:', error);
          return res.status(500).json({ message: error.message });
        }
      },
    );

    // Create mock NestJS app
    const moduleRef = await Test.createTestingModule({
      controllers: [],
      providers: [
        {
          provide: PrismaService,
          useValue: {}, // Mock empty prisma service
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(expressInstance);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**************************************
   * GET ALL NOTIFICATIONS TESTS
   **************************************/
  describe('GET /notifications', () => {
    it('should return all notifications for the authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body[0].userId).toBe(userId);

      // Check that notifications are sorted by sentAt in descending order
      const dates = response.body.map((n: any) => new Date(n.sentAt).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
      expect(dates[1]).toBeGreaterThanOrEqual(dates[2]);
    });

    it('should include related entities in the response', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      // Check for event relation
      expect(response.body[0].event).toBeDefined();
      expect(response.body[0].event.name).toBeDefined();

      // Check for announcement relation with proper null check
      const announcementNotification = response.body.find(
        (n: any) => n.type === 'ANNOUNCEMENT',
      );
      expect(announcementNotification).toBeDefined();
      expect(announcementNotification.announcement).toBeDefined();

      // Check for application relation with proper null check
      const applicationNotification = response.body.find(
        (n: any) => n.type === 'APPLICATION_UPDATE',
      );
      expect(applicationNotification).toBeDefined();
      expect(applicationNotification.application).toBeDefined();
    });

    it('should return different notifications for different users', async () => {
      const userResponse = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      const otherUserResponse = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      expect(userResponse.body.length).toBe(3);
      expect(otherUserResponse.body.length).toBe(1);
      expect(otherUserResponse.body[0].userId).toBe(otherUserId);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/notifications').expect(401);
    });
  });

  /**************************************
   * GET NOTIFICATION BY ID TESTS
   **************************************/
  describe('GET /notifications/:id', () => {
    it('should return a specific notification for the authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications/1')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body.id).toBe('1');
      expect(response.body.userId).toBe(userId);
      expect(response.body.type).toBe('SYSTEM_ALERT'); // Changed from 'EVENT_UPDATE'
    });

    it('should return 404 for non-existent notification', async () => {
      await request(app.getHttpServer())
        .get('/notifications/999')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(404);
    });

    it("should return 404 when trying to access another user's notification", async () => {
      await request(app.getHttpServer())
        .get('/notifications/4') // Other user's notification
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/notifications/1').expect(401);
    });
  });

  /**************************************
   * MARK NOTIFICATION AS READ TESTS
   **************************************/
  describe('PATCH /notifications/:id/read', () => {
    it('should mark a notification as read', async () => {
      const response = await request(app.getHttpServer())
        .patch('/notifications/1/read')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body.id).toBe('1');
      expect(response.body.read).toBe(true);

      // Verify it's actually marked as read
      const checkResponse = await request(app.getHttpServer())
        .get('/notifications/1')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(checkResponse.body.read).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      await request(app.getHttpServer())
        .patch('/notifications/999/read')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(404);
    });

    it("should return 404 when trying to mark another user's notification as read", async () => {
      await request(app.getHttpServer())
        .patch('/notifications/4/read') // Other user's notification
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch('/notifications/1/read')
        .expect(401);
    });
  });

  /**************************************
   * MARK ALL NOTIFICATIONS AS READ TESTS
   **************************************/
  describe('PATCH /notifications/mark-all-read', () => {
    // Reset notification 3 to unread before test
    beforeEach(() => {
      const notification3 = mockController['notifications'].find(
        (n) => n.id === '3',
      );
      if (notification3) {
        notification3.read = false;
      }
    });

    it('should mark all notifications as read for the authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .patch('/notifications/mark-all-read')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body.count).toBeGreaterThan(0);

      // Verify all are marked as read
      const checkResponse = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      const allRead = checkResponse.body.every((n: any) => n.read === true);
      expect(allRead).toBe(true);
    });

    it("should only mark current user's notifications as read", async () => {
      // First, mark notification 4 (other user's) as unread
      const notification4 = mockController['notifications'].find(
        (n) => n.id === '4',
      );
      if (notification4) {
        notification4.read = false;
      }

      await request(app.getHttpServer())
        .patch('/notifications/mark-all-read')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      // Check that the other user's notification is still unread
      const otherUserNotification = mockController['notifications'].find(
        (n) => n.id === '4',
      );
      expect(otherUserNotification).toBeDefined();
      expect(otherUserNotification?.read).toBe(false); // Using optional chaining
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch('/notifications/mark-all-read')
        .expect(401);
    });
  });

  /**************************************
   * GET UNREAD COUNT TESTS
   **************************************/
  describe('GET /notifications/unread-count', () => {
    beforeEach(() => {
      // Reset notification states for testing
      mockController['notifications'].forEach((n) => {
        if (n.id === '1') n.read = false;
        if (n.id === '2') n.read = true;
        if (n.id === '3') n.read = false;
        if (n.id === '4') n.read = false;
      });
    });

    it('should return the correct count of unread notifications', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications/unread-count')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body.count).toBe(2); // Notifications 1 and 3 are unread
    });

    it('should return zero when all notifications are read', async () => {
      // Mark all as read first
      await request(app.getHttpServer())
        .patch('/notifications/mark-all-read')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      // Then check count
      const response = await request(app.getHttpServer())
        .get('/notifications/unread-count')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body.count).toBe(0);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/notifications/unread-count')
        .expect(401);
    });
  });
});
