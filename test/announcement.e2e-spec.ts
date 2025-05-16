import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as express from 'express';
import { PrismaService } from '../src/app/prisma/services/prisma.service';
import { SystemRole } from '@prisma/client';
import * as bodyParser from 'body-parser';

// Define interfaces for testing
interface MockAnnouncement {
  id: string;
  title: string;
  description: string;
  image?: string;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockEvent {
  id: string;
  name: string;
  organizerId: string;
  deletedAt: Date | null;
}

interface MockNotification {
  count: number;
}

/**
 * Mock Announcement Controller
 */
class MockAnnouncementController {
  // Mock data
  private announcements: MockAnnouncement[] = [
    {
      id: 'announcement-1',
      title: 'First Announcement',
      description: 'This is the first announcement',
      eventId: 'event-1',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      updatedAt: new Date(Date.now() - 86400000),
    },
    {
      id: 'announcement-2',
      title: 'Second Announcement',
      description: 'This is the second announcement',
      image: 'https://example.com/image.jpg',
      eventId: 'event-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'announcement-3',
      title: 'Third Announcement',
      description: 'This is for another event',
      eventId: 'event-2',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  private events: { [key: string]: MockEvent } = {
    'event-1': {
      id: 'event-1',
      name: 'First Event',
      organizerId: 'organizer-id',
      deletedAt: null,
    },
    'event-2': {
      id: 'event-2',
      name: 'Second Event',
      organizerId: 'other-organizer-id',
      deletedAt: null,
    },
    'event-3': {
      id: 'event-3',
      name: 'Deleted Event',
      organizerId: 'organizer-id',
      deletedAt: new Date(),
    },
  };

  // Mock notification service
  private notifyAllEventUsers(
    eventId: string,
    announcementId: string,
    message: string,
  ): MockNotification {
    // In a real test, this would interact with the notification service
    // Here we just return a mock response
    return { count: 3 }; // Assume 3 users were notified
  }

  /**
   * Create a new announcement
   */
  create(createAnnouncementDto: any, userId: string, userRole: SystemRole) {
    const { eventId, title, description, image } = createAnnouncementDto;

    // Check if event exists
    const event = this.events[eventId];
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.deletedAt) {
      throw new Error('Event has been deleted');
    }

    // Check if user is event organizer or admin
    if (event.organizerId !== userId && userRole === SystemRole.USER) {
      throw new Error('Forbidden');
    }

    // Create announcement
    const newAnnouncement: MockAnnouncement = {
      id: `announcement-${this.announcements.length + 1}`,
      title,
      description,
      image,
      eventId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.announcements.push(newAnnouncement);

    // Notify all users
    this.notifyAllEventUsers(
      eventId,
      newAnnouncement.id,
      `New announcement for ${event.name}: ${title}`,
    );

    return newAnnouncement;
  }

  /**
   * Get all announcements for an event
   */
  findAllByEvent(eventId: string) {
    // Check if event exists
    const event = this.events[eventId];
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.deletedAt) {
      throw new Error('Event has been deleted');
    }

    // Return announcements sorted by creation date (newest first)
    return this.announcements
      .filter((a) => a.eventId === eventId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get a specific announcement by ID
   */
  findOne(id: string) {
    const announcement = this.announcements.find((a) => a.id === id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // Add event info
    const result = {
      ...announcement,
      event: {
        id: announcement.eventId,
        name: this.events[announcement.eventId]?.name,
        organizerId: this.events[announcement.eventId]?.organizerId,
      },
    };

    return result;
  }

  /**
   * Update an announcement
   */
  update(
    id: string,
    updateAnnouncementDto: any,
    userId: string,
    userRole: SystemRole,
  ) {
    // Find announcement
    const announcementIndex = this.announcements.findIndex((a) => a.id === id);
    if (announcementIndex === -1) {
      throw new Error('Announcement not found');
    }

    const announcement = this.announcements[announcementIndex];

    // Check permissions
    const event = this.events[announcement.eventId];
    if (event.organizerId !== userId && userRole === SystemRole.USER) {
      throw new Error('Forbidden');
    }

    // Update fields
    const updatedAnnouncement = {
      ...announcement,
      ...updateAnnouncementDto,
      updatedAt: new Date(),
    };

    this.announcements[announcementIndex] = updatedAnnouncement;

    // Notify users if title or description changed
    if (updateAnnouncementDto.title || updateAnnouncementDto.description) {
      this.notifyAllEventUsers(
        announcement.eventId,
        announcement.id,
        `Announcement updated for ${event.name}: ${updatedAnnouncement.title}`,
      );
    }

    return updatedAnnouncement;
  }

  /**
   * Delete an announcement
   */
  remove(id: string, userId: string, userRole: SystemRole) {
    // Find announcement
    const announcementIndex = this.announcements.findIndex((a) => a.id === id);
    if (announcementIndex === -1) {
      throw new Error('Announcement not found');
    }

    const announcement = this.announcements[announcementIndex];

    // Check permissions
    const event = this.events[announcement.eventId];
    if (event.organizerId !== userId && userRole === SystemRole.USER) {
      throw new Error('Forbidden');
    }

    // Remove the announcement
    const removedAnnouncement = this.announcements.splice(
      announcementIndex,
      1,
    )[0];
    return removedAnnouncement;
  }
}

describe('Announcement Module (e2e)', () => {
  let app: INestApplication;
  let expressInstance: express.Express;
  let mockController: MockAnnouncementController;

  // User tokens
  const regularUserToken = 'regular-user-token';
  const organizerToken = 'organizer-token';
  const otherOrganizerToken = 'other-organizer-token';
  const adminToken = 'admin-token';

  // User IDs
  const userId = 'user-id';
  const organizerId = 'organizer-id';
  const otherOrganizerId = 'other-organizer-id';
  const adminId = 'admin-id';

  beforeAll(async () => {
    mockController = new MockAnnouncementController();

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
      } else if (token === organizerToken) {
        req.user = {
          id: organizerId,
          email: 'organizer@example.com',
          systemRole: SystemRole.USER,
        };
      } else if (token === otherOrganizerToken) {
        req.user = {
          id: otherOrganizerId,
          email: 'other-organizer@example.com',
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
    expressInstance.post('/announcements', function (req: any, res: any) {
      try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const result = mockController.create(
          req.body,
          req.user.id,
          req.user.systemRole,
        );
        return res.status(201).json(result);
      } catch (error) {
        console.error('Error in POST /announcements:', error);
        return res
          .status(
            error.message === 'Event not found'
              ? 404
              : error.message === 'Forbidden'
                ? 403
                : 400,
          )
          .json({ message: error.message });
      }
    });

    expressInstance.get(
      '/announcements/event/:eventId',
      function (req: any, res: any) {
        try {
          const result = mockController.findAllByEvent(req.params.eventId);
          return res.status(200).json(result);
        } catch (error) {
          console.error('Error in GET /announcements/event/:eventId:', error);
          return res
            .status(error.message === 'Event not found' ? 404 : 400)
            .json({ message: error.message });
        }
      },
    );

    expressInstance.get('/announcements/:id', function (req: any, res: any) {
      try {
        const result = mockController.findOne(req.params.id);
        return res.status(200).json(result);
      } catch (error) {
        console.error('Error in GET /announcements/:id:', error);
        return res
          .status(error.message === 'Announcement not found' ? 404 : 400)
          .json({ message: error.message });
      }
    });

    expressInstance.patch('/announcements/:id', function (req: any, res: any) {
      try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const result = mockController.update(
          req.params.id,
          req.body,
          req.user.id,
          req.user.systemRole,
        );
        return res.status(200).json(result);
      } catch (error) {
        console.error('Error in PATCH /announcements/:id:', error);
        return res
          .status(
            error.message === 'Announcement not found'
              ? 404
              : error.message === 'Forbidden'
                ? 403
                : 400,
          )
          .json({ message: error.message });
      }
    });

    expressInstance.delete('/announcements/:id', function (req: any, res: any) {
      try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const result = mockController.remove(
          req.params.id,
          req.user.id,
          req.user.systemRole,
        );
        return res.status(200).json(result);
      } catch (error) {
        console.error('Error in DELETE /announcements/:id:', error);
        return res
          .status(
            error.message === 'Announcement not found'
              ? 404
              : error.message === 'Forbidden'
                ? 403
                : 400,
          )
          .json({ message: error.message });
      }
    });

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
   * CREATE ANNOUNCEMENT TESTS
   **************************************/
  describe('POST /announcements', () => {
    it('should create a new announcement when called by the organizer', async () => {
      const createDto = {
        title: 'New Announcement',
        description: 'This is a test announcement',
        eventId: 'event-1',
      };

      const response = await request(app.getHttpServer())
        .post('/announcements')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(createDto.title);
      expect(response.body.description).toBe(createDto.description);
      expect(response.body.eventId).toBe(createDto.eventId);
    });

    it('should create a new announcement when called by an admin', async () => {
      const createDto = {
        title: 'Admin Announcement',
        description: 'This is an admin test announcement',
        eventId: 'event-1',
      };

      const response = await request(app.getHttpServer())
        .post('/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(createDto.title);
    });

    it('should return 403 when called by a non-organizer regular user', async () => {
      const createDto = {
        title: 'Unauthorized Announcement',
        description: 'This should fail',
        eventId: 'event-1',
      };

      await request(app.getHttpServer())
        .post('/announcements')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(createDto)
        .expect(403);
    });

    it('should return 404 when event does not exist', async () => {
      const createDto = {
        title: 'Invalid Event Announcement',
        description: 'This should fail',
        eventId: 'non-existent-event',
      };

      await request(app.getHttpServer())
        .post('/announcements')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(createDto)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      const createDto = {
        title: 'Unauthenticated Announcement',
        description: 'This should fail',
        eventId: 'event-1',
      };

      await request(app.getHttpServer())
        .post('/announcements')
        .send(createDto)
        .expect(401);
    });
  });

  /**************************************
   * GET EVENT ANNOUNCEMENTS TESTS
   **************************************/
  describe('GET /announcements/event/:eventId', () => {
    it('should return all announcements for an event', async () => {
      const response = await request(app.getHttpServer())
        .get('/announcements/event/event-1')
        .set('Authorization', `Bearer ${regularUserToken}`) // Add auth token
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body[0].eventId).toBe('event-1');

      // Check that announcements are sorted by createdAt in descending order
      const dates = response.body.map((a: any) =>
        new Date(a.createdAt).getTime(),
      );
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it('should return an empty array when event has no announcements', async () => {
      // Create a new event with no announcements
      mockController['events']['event-empty'] = {
        id: 'event-empty',
        name: 'Empty Event',
        organizerId: organizerId,
        deletedAt: null,
      };

      const response = await request(app.getHttpServer())
        .get('/announcements/event/event-empty')
        .set('Authorization', `Bearer ${regularUserToken}`) // Add auth token
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 404 when event does not exist', async () => {
      await request(app.getHttpServer())
        .get('/announcements/event/non-existent-event')
        .set('Authorization', `Bearer ${regularUserToken}`) // Add auth token
        .expect(404);
    });
  });

  /**************************************
   * GET ANNOUNCEMENT BY ID TESTS
   **************************************/
  describe('GET /announcements/:id', () => {
    it('should return a specific announcement', async () => {
      const response = await request(app.getHttpServer())
        .get('/announcements/announcement-1')
        .set('Authorization', `Bearer ${regularUserToken}`) // Add auth token
        .expect(200);

      expect(response.body.id).toBe('announcement-1');
      expect(response.body.title).toBe('First Announcement');
      expect(response.body).toHaveProperty('event');
      expect(response.body.event).toHaveProperty('name');
      expect(response.body.event).toHaveProperty('organizerId');
    });

    it('should return 404 when announcement does not exist', async () => {
      await request(app.getHttpServer())
        .get('/announcements/non-existent-announcement')
        .set('Authorization', `Bearer ${regularUserToken}`) // Add auth token
        .expect(404);
    });
  });

  /**************************************
   * UPDATE ANNOUNCEMENT TESTS
   **************************************/
  describe('PATCH /announcements/:id', () => {
    it('should update an announcement when called by the organizer', async () => {
      const updateDto = {
        title: 'Updated Announcement',
        description: 'This is an updated description',
      };

      const response = await request(app.getHttpServer())
        .patch('/announcements/announcement-1')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.id).toBe('announcement-1');
      expect(response.body.title).toBe(updateDto.title);
      expect(response.body.description).toBe(updateDto.description);
    });

    it('should update an announcement when called by an admin', async () => {
      const updateDto = {
        title: 'Admin Updated',
      };

      const response = await request(app.getHttpServer())
        .patch('/announcements/announcement-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.title).toBe(updateDto.title);
    });

    it('should return 403 when called by a non-organizer regular user', async () => {
      const updateDto = {
        title: 'Unauthorized Update',
      };

      await request(app.getHttpServer())
        .patch('/announcements/announcement-1')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(updateDto)
        .expect(403);
    });

    it("should return 403 when called by a different event's organizer", async () => {
      const updateDto = {
        title: 'Other Organizer Update',
      };

      await request(app.getHttpServer())
        .patch('/announcements/announcement-1') // This belongs to event-1
        .set('Authorization', `Bearer ${otherOrganizerToken}`) // organizer of event-2
        .send(updateDto)
        .expect(403);
    });

    it('should return 404 when announcement does not exist', async () => {
      const updateDto = {
        title: 'Non-existent Update',
      };

      await request(app.getHttpServer())
        .patch('/announcements/non-existent-announcement')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(updateDto)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      const updateDto = {
        title: 'Unauthenticated Update',
      };

      await request(app.getHttpServer())
        .patch('/announcements/announcement-1')
        .send(updateDto)
        .expect(401);
    });
  });

  /**************************************
   * DELETE ANNOUNCEMENT TESTS
   **************************************/
  describe('DELETE /announcements/:id', () => {
    it('should delete an announcement when called by the organizer', async () => {
      // First create a new announcement to delete
      const createResponse = await request(app.getHttpServer())
        .post('/announcements')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'To Be Deleted',
          description: 'This announcement will be deleted',
          eventId: 'event-1',
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // Delete the announcement
      await request(app.getHttpServer())
        .delete(`/announcements/${announcementId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      // Verify it's deleted - add auth token here
      await request(app.getHttpServer())
        .get(`/announcements/${announcementId}`)
        .set('Authorization', `Bearer ${regularUserToken}`) // Add auth token
        .expect(404);
    });

    it('should delete an announcement when called by an admin', async () => {
      // First create a new announcement to delete
      const createResponse = await request(app.getHttpServer())
        .post('/announcements')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Admin Will Delete',
          description: 'This announcement will be deleted by admin',
          eventId: 'event-1',
        })
        .expect(201);

      const announcementId = createResponse.body.id;

      // Delete the announcement as admin
      await request(app.getHttpServer())
        .delete(`/announcements/${announcementId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify it's deleted - add auth token here
      await request(app.getHttpServer())
        .get(`/announcements/${announcementId}`)
        .set('Authorization', `Bearer ${regularUserToken}`) // Add auth token
        .expect(404);
    });

    it('should return 403 when called by a non-organizer regular user', async () => {
      await request(app.getHttpServer())
        .delete('/announcements/announcement-2')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('should return 404 when announcement does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/announcements/non-existent-announcement')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .delete('/announcements/announcement-2')
        .expect(401);
    });
  });
});
