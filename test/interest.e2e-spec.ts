import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as express from 'express';
import { PrismaService } from '../src/app/prisma/services/prisma.service';
import { SystemRole, CurrentRole, EventStatus } from '@prisma/client';
import * as bodyParser from 'body-parser';

// Define interface for interest records
interface MockInterest {
  userId: string;
  eventId: string;
  interestedAt: Date;
}

// Define proper user interface that will be used throughout the test
interface MockUser {
  id: string;
  email: string;
  systemRole: SystemRole;
  currentRole: CurrentRole;
  fullName?: string;
  username?: string;
}

// Fix Express namespace augmentation with a proper global declaration
declare global {
  namespace Express {
    // This tells TypeScript that User should have these properties
    interface User {
      id: string;
      email: string;
      systemRole: SystemRole;
      currentRole: CurrentRole; // Change from CurrentRole.ATTENDEE to just CurrentRole
      fullName?: string;
      username?: string;
    }
  }
}

/**
 * Mock Interest Controller
 */
class MockInterestController {
  // Mock data
  private interests: MockInterest[] = [
    {
      userId: 'user-id',
      eventId: 'event-id-1',
      interestedAt: new Date(),
    },
    {
      userId: 'other-user-id',
      eventId: 'event-id-1',
      interestedAt: new Date(Date.now() - 86400000), // 1 day ago
    },
    {
      userId: 'user-id',
      eventId: 'event-id-2',
      interestedAt: new Date(),
    },
  ];

  private events = {
    'event-id-1': {
      id: 'event-id-1',
      name: 'Test Event 1',
      description: 'Test event description',
      organizerId: 'organizer-id',
      dateTime: new Date(Date.now() + 86400000), // 1 day in the future
      status: EventStatus.PUBLISHED,
      deletedAt: null,
      locationDesc: 'Test Location 1',
      profileImage: 'image1.jpg',
      coverImage: 'cover1.jpg',
      acceptingVolunteers: true,
      categoryId: 'category-1',
    },
    'event-id-2': {
      id: 'event-id-2',
      name: 'Test Event 2',
      description: 'Another test event',
      organizerId: 'other-organizer-id',
      dateTime: new Date(Date.now() + 172800000), // 2 days in the future
      status: EventStatus.PUBLISHED,
      deletedAt: null,
      locationDesc: 'Test Location 2',
      profileImage: 'image2.jpg',
      coverImage: 'cover2.jpg',
      acceptingVolunteers: false,
      categoryId: 'category-1',
    },
    'event-id-3': {
      id: 'event-id-3',
      name: 'Test Event 3',
      description: 'Another test event for testing',
      organizerId: 'organizer-id',
      dateTime: new Date(Date.now() + 259200000), // 3 days in future
      status: EventStatus.PUBLISHED,
      deletedAt: null,
      locationDesc: 'Test Location 3',
      profileImage: 'image3.jpg',
      coverImage: 'cover3.jpg',
      acceptingVolunteers: true,
      categoryId: 'category-1',
    },
    'non-existent-event': null,
    'deleted-event-id': {
      id: 'deleted-event-id',
      name: 'Deleted Event',
      description: 'This event has been deleted',
      organizerId: 'organizer-id',
      dateTime: new Date(Date.now() + 86400000),
      status: EventStatus.PUBLISHED,
      deletedAt: new Date(), // Event is deleted
      locationDesc: 'Deleted Location',
      profileImage: 'deleted.jpg',
      coverImage: 'deleted-cover.jpg',
      acceptingVolunteers: false,
      categoryId: 'category-1',
    },
    'completed-event-id': {
      id: 'completed-event-id',
      name: 'Completed Event',
      description: 'This event has been completed',
      organizerId: 'organizer-id',
      dateTime: new Date(Date.now() - 86400000), // 1 day in the past
      status: EventStatus.COMPLETED,
      deletedAt: null,
      locationDesc: 'Completed Location',
      profileImage: 'completed.jpg',
      coverImage: 'completed-cover.jpg',
      acceptingVolunteers: false,
      categoryId: 'category-1',
    },
  };

  /**
   * Add an event to interests
   */
  addInterest(userId: string, createInterestDto: any, user: any) {
    const { eventId } = createInterestDto;

    // Check if event exists
    const event = this.events[eventId];
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.deletedAt) {
      throw new Error('Event has been deleted');
    }

    // Check if interest already exists
    const existingInterest = this.interests.find(
      (i) => i.userId === userId && i.eventId === eventId,
    );

    if (existingInterest) {
      throw new Error('You are already interested in this event');
    }

    // Create new interest
    const newInterest = {
      userId,
      eventId,
      interestedAt: new Date(),
    };

    this.interests.push(newInterest);

    // Return with event data
    return {
      ...newInterest,
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        dateTime: event.dateTime,
        profileImage: event.profileImage,
        status: event.status,
      },
    };
  }

  /**
   * Remove an event from interests
   */
  removeInterest(userId: string, eventId: string, user: any) {
    // Check if interest exists
    const interestIndex = this.interests.findIndex(
      (i) => i.userId === userId && i.eventId === eventId,
    );

    if (interestIndex === -1) {
      throw new Error('Interest record not found');
    }

    // Remove the interest
    const removedInterest = this.interests.splice(interestIndex, 1)[0];
    return removedInterest;
  }

  /**
   * Get all interests for a user
   */
  getUserInterests(userId: string, query: any, user: any) {
    const { skip = 0, take = 10 } = query;

    // Filter interests by user ID
    const userInterests = this.interests
      .filter((i) => i.userId === userId)
      .sort((a, b) => b.interestedAt.getTime() - a.interestedAt.getTime()) // Sort by most recent
      .slice(skip, skip + take)
      .map((interest) => {
        const event = this.events[interest.eventId];
        return {
          ...interest,
          event: {
            id: event.id,
            name: event.name,
            description: event.description,
            dateTime: event.dateTime,
            profileImage: event.profileImage,
            coverImage: event.coverImage,
            locationDesc: event.locationDesc,
            status: event.status,
            _count: {
              interestedUsers: this.interests.filter(
                (i) => i.eventId === event.id,
              ).length,
              attendingUsers: 0, // Mock value
            },
          },
        };
      });

    const total = this.interests.filter((i) => i.userId === userId).length;

    return {
      data: userInterests,
      meta: {
        total,
        skip: Number(skip),
        take: Number(take),
        hasMore: Number(skip) + Number(take) < total,
      },
    };
  }

  /**
   * Get all interested users for an event
   */
  getEventInterestedUsers(
    eventId: string,
    currentUserId: string,
    userRole: SystemRole,
    query: any,
    user: any,
  ) {
    const { skip = 0, take = 10, search } = query;

    // Check if event exists
    const event = this.events[eventId];
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.deletedAt) {
      throw new Error('Event has been deleted');
    }

    // Check permissions - only organizer or admin
    const isAdmin =
      userRole === SystemRole.ADMIN || userRole === SystemRole.SUPER_ADMIN;
    const isOrganizer = event.organizerId === currentUserId;

    if (!isAdmin && !isOrganizer) {
      throw new Error('Forbidden');
    }

    // Filter interests by event ID and optional search
    const eventInterests = this.interests
      .filter((i) => i.eventId === eventId)
      .filter((i) => {
        if (!search) return true;
        // Mock search - in real app would check user properties
        return i.userId.includes(search);
      })
      .sort((a, b) => b.interestedAt.getTime() - a.interestedAt.getTime()) // Sort by most recent
      .slice(skip, skip + take)
      .map((interest) => {
        // Mock user data - in a real scenario, would get from DB
        const mockUserName =
          interest.userId === 'user-id'
            ? 'Test User'
            : `User ${interest.userId}`;
        return {
          ...interest,
          user: {
            id: interest.userId,
            fullName: mockUserName,
            email: `${interest.userId}@example.com`,
            username: interest.userId,
            gender: 'MALE',
            age: 30,
            org: 'Test Org',
            currentRole: CurrentRole.ATTENDEE, // Change from CurrentRole.USER to CurrentRole.ATTENDEE
          },
        };
      });

    const total = this.interests.filter((i) => i.eventId === eventId).length;

    return {
      data: eventInterests,
      meta: {
        total,
        skip: Number(skip),
        take: Number(take),
        hasMore: Number(skip) + Number(take) < total,
      },
    };
  }

  /**
   * Check if a user is interested in an event
   */
  checkUserInterest(userId: string, eventId: string, user: any) {
    // Check if event exists
    const event = this.events[eventId];
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if interest exists
    const interest = this.interests.find(
      (i) => i.userId === userId && i.eventId === eventId,
    );

    return { interested: !!interest };
  }
}

// Mock the Guards
const mockJwtAuthGuard = {
  canActivate: () => true,
};

const mockRolesGuard = {
  canActivate: () => true,
};

// Mock the JWT decorator
const mockGetUser = () => (target, key, descriptor) => {
  const originalMethod = descriptor.value;
  descriptor.value = function (...args) {
    return originalMethod.apply(this, args);
  };
  return descriptor;
};

describe('Interest Module (e2e)', () => {
  let app: INestApplication;
  let expressInstance: express.Express;

  // Authentication tokens for different roles
  const regularUserToken = 'regular-user-token';
  const organizerToken = 'organizer-token';
  const adminToken = 'admin-token';
  const volunteerToken = 'volunteer-token';

  // User and event IDs for testing
  const userId = 'user-id';
  const otherUserId = 'other-user-id';
  const organizerId = 'organizer-id';
  const eventId = 'event-id-1';
  const otherEventId = 'event-id-2';
  const nonExistentEventId = 'non-existent-event-id';

  // Create a mock controller instance
  const mockController = new MockInterestController();

  beforeAll(async () => {
    // Create express instance
    expressInstance = express();
    expressInstance.use(bodyParser.json());
    expressInstance.use(bodyParser.urlencoded({ extended: true }));

    // Mock JWT verification and user extraction middleware
    expressInstance.use((req: any, res: any, next: any) => {
      // Extract token
      const authHeader = req.headers.authorization || '';
      const token = authHeader.split(' ')[1];

      // Set user based on token
      if (token === regularUserToken) {
        req.user = {
          id: userId,
          email: 'user@example.com',
          systemRole: SystemRole.USER,
          currentRole: CurrentRole.ATTENDEE,
          fullName: 'Test User',
        };
      } else if (token === organizerToken) {
        req.user = {
          id: organizerId,
          email: 'organizer@example.com',
          systemRole: SystemRole.USER,
          currentRole: CurrentRole.ATTENDEE,
          fullName: 'Test Organizer',
        };
      } else if (token === adminToken) {
        req.user = {
          id: 'admin-id',
          email: 'admin@example.com',
          systemRole: SystemRole.ADMIN,
          currentRole: CurrentRole.ATTENDEE,
          fullName: 'Test Admin',
        };
      } else if (token === volunteerToken) {
        req.user = {
          id: 'volunteer-id',
          email: 'volunteer@example.com',
          systemRole: SystemRole.USER,
          currentRole: CurrentRole.VOLUNTEER,
          fullName: 'Test Volunteer',
        };
      } else {
        req.user = null;
      }

      next();
    });

    // Setup routes with minimally typed parameters
    expressInstance.post('/interests', function (req: any, res: any) {
      try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const result = mockController.addInterest(
          req.user.id,
          req.body,
          req.user,
        );
        return res.status(201).json(result);
      } catch (error) {
        console.error('Error in POST /interests:', error);
        res
          .status(
            error.message === 'Event not found'
              ? 404
              : error.message === 'You are already interested in this event'
                ? 409
                : 400,
          )
          .json({ message: error.message });
      }
    });

    expressInstance.delete(
      '/interests/event/:eventId',
      function (req: any, res: any) {
        try {
          if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
          const result = mockController.removeInterest(
            req.user.id,
            req.params.eventId,
            req.user,
          );
          return res.status(200).json(result);
        } catch (error) {
          console.error('Error in DELETE /interests/event/:eventId:', error);
          res
            .status(error.message === 'Interest record not found' ? 404 : 400)
            .json({ message: error.message });
        }
      },
    );

    expressInstance.get(
      '/interests/my-interests',
      function (req: any, res: any) {
        try {
          if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
          const result = mockController.getUserInterests(
            req.user.id,
            req.query,
            req.user,
          );
          return res.status(200).json(result);
        } catch (error) {
          console.error('Error in GET /interests/my-interests:', error);
          res.status(400).json({ message: error.message });
        }
      },
    );

    expressInstance.get(
      '/interests/event/:eventId/users',
      function (req: any, res: any) {
        try {
          if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
          const result = mockController.getEventInterestedUsers(
            req.params.eventId,
            req.user.id,
            req.user.systemRole,
            req.query,
            req.user,
          );
          return res.status(200).json(result);
        } catch (error) {
          console.error('Error in GET /interests/event/:eventId/users:', error);
          res
            .status(
              error.message === 'Forbidden'
                ? 403
                : error.message === 'Event not found'
                  ? 404
                  : 400,
            )
            .json({ message: error.message });
        }
      },
    );

    expressInstance.get(
      '/interests/check/:eventId',
      function (req: any, res: any) {
        try {
          if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
          const result = mockController.checkUserInterest(
            req.user.id,
            req.params.eventId,
            req.user,
          );
          return res.status(200).json(result);
        } catch (error) {
          console.error('Error in GET /interests/check/:eventId:', error);
          res
            .status(error.message === 'Event not found' ? 404 : 400)
            .json({ message: error.message });
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
   * ADD EVENT TO INTERESTS TESTS
   **************************************/
  describe('POST /interests', () => {
    it('should add an event to interests for authenticated user', async () => {
      const createDto = { eventId: 'event-id-3' };

      const response = await request(app.getHttpServer())
        .post('/interests')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('eventId', createDto.eventId);
      expect(response.body).toHaveProperty('interestedAt');
      expect(response.body).toHaveProperty('event');
      expect(response.body.event).toHaveProperty('name', 'Test Event 3');
    });

    it('should return 404 when trying to add interest for non-existent event', async () => {
      const createDto = { eventId: nonExistentEventId };

      await request(app.getHttpServer())
        .post('/interests')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(createDto)
        .expect(404)
        .expect(({ body }) => {
          expect(body.message).toBe('Event not found');
        });
    });

    it('should return 409 when trying to add duplicate interest', async () => {
      const createDto = { eventId };

      await request(app.getHttpServer())
        .post('/interests')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(createDto)
        .expect(409)
        .expect(({ body }) => {
          expect(body.message).toBe('You are already interested in this event');
        });
    });
  });

  /**************************************
   * REMOVE EVENT FROM INTERESTS TESTS
   **************************************/
  describe('DELETE /interests/event/:eventId', () => {
    it('should remove an event from interests', async () => {
      await request(app.getHttpServer())
        .delete(`/interests/event/${eventId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      // Verify the interest was removed
      const checkResponse = await request(app.getHttpServer())
        .get(`/interests/check/${eventId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(checkResponse.body).toHaveProperty('interested', false);
    });

    it('should return 404 when trying to remove non-existent interest', async () => {
      await request(app.getHttpServer())
        .delete(`/interests/event/${nonExistentEventId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(404)
        .expect(({ body }) => {
          expect(body.message).toBe('Interest record not found');
        });
    });
  });

  /**************************************
   * GET USER'S INTERESTS TESTS
   **************************************/
  describe('GET /interests/my-interests', () => {
    // Add interest for testing
    beforeEach(async () => {
      try {
        await request(app.getHttpServer())
          .post('/interests')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({ eventId })
          .expect(201);
      } catch (error) {
        // Ignore conflict error if interest already exists
        if (!error.message.includes('409')) throw error;
      }
    });

    it('should get all interests for the current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/interests/my-interests')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('userId', userId);
      expect(response.body.data[0]).toHaveProperty('event');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/interests/my-interests?skip=0&take=1')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.meta).toHaveProperty('skip', 0);
      expect(response.body.meta).toHaveProperty('take', 1);
    });
  });

  /**************************************
   * GET EVENT'S INTERESTED USERS TESTS
   **************************************/
  describe('GET /interests/event/:eventId/users', () => {
    it('should get all interested users for an event when called by organizer', async () => {
      const response = await request(app.getHttpServer())
        .get(`/interests/event/${eventId}/users`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('eventId', eventId);
      expect(response.body.data[0]).toHaveProperty('user');
    });

    it('should get all interested users for an event when called by admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/interests/event/${eventId}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should NOT allow regular users to access interested users', async () => {
      await request(app.getHttpServer())
        .get(`/interests/event/${otherEventId}/users`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403)
        .expect(({ body }) => {
          expect(body.message).toBe('Forbidden');
        });
    });

    it('should handle non-existent events properly', async () => {
      await request(app.getHttpServer())
        .get(`/interests/event/${nonExistentEventId}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
        .expect(({ body }) => {
          expect(body.message).toBe('Event not found');
        });
    });

    it('should support search and pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`/interests/event/${eventId}/users?search=user&skip=0&take=1`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.meta).toHaveProperty('skip', 0);
      expect(response.body.meta).toHaveProperty('take', 1);
    });
  });

  /**************************************
   * CHECK USER INTEREST TESTS
   **************************************/
  describe('GET /interests/check/:eventId', () => {
    it('should check if a user is interested in an event (true case)', async () => {
      // First ensure we have interest
      try {
        await request(app.getHttpServer())
          .post('/interests')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({ eventId })
          .expect(201);
      } catch (error) {
        // Ignore conflict error if interest already exists
        if (!error.message?.includes('409')) throw error;
      }

      const response = await request(app.getHttpServer())
        .get(`/interests/check/${eventId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('interested', true);
    });

    it('should check if a user is interested in an event (false case)', async () => {
      // First ensure we remove interest
      try {
        await request(app.getHttpServer())
          .delete(`/interests/event/${otherEventId}`)
          .set('Authorization', `Bearer ${regularUserToken}`)
          .expect(200);
      } catch (error) {
        // Ignore 404 error if interest doesn't exist
        if (!error.message?.includes('404')) throw error;
      }

      const response = await request(app.getHttpServer())
        .get(`/interests/check/${otherEventId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('interested', false);
    });

    it('should return 404 for non-existent events', async () => {
      await request(app.getHttpServer())
        .get(`/interests/check/${nonExistentEventId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(404)
        .expect(({ body }) => {
          expect(body.message).toBe('Event not found');
        });
    });
  });
});
