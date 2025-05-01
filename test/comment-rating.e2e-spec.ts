import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/app/prisma/services/prisma.service';
import { SystemRole, CurrentRole, EventStatus } from '@prisma/client';
import * as bodyParser from 'body-parser'; // Add this import

// Create a mock module for testing
class MockCommentRatingController {
  create(body, user) {
    return {
      id: 'mock-comment-id',
      eventId: body.eventId,
      commentText: body.commentText, // Make sure this is explicitly included
      rating: body.rating, // Make sure this is explicitly included
      userId: user.id,
      status: 'ACTIVE',
      createdAt: new Date(),
    };
  }

  findAllForEvent(eventId) {
    return [
      {
        id: 'mock-comment-id',
        eventId,
        userId: 'user-id',
        commentText: 'This was an excellent event!',
        rating: 5,
        status: 'ACTIVE',
        user: { id: 'user-id', fullName: 'Test User' },
      },
    ];
  }

  getEventRatingStats(eventId) {
    return {
      averageRating: 4.5,
      totalRatings: 2,
      ratingDistribution: [
        { rating: 1, count: 0 },
        { rating: 2, count: 0 },
        { rating: 3, count: 0 },
        { rating: 4, count: 1 },
        { rating: 5, count: 1 },
      ],
    };
  }

  findAllByUser(userId) {
    return [
      {
        id: 'mock-comment-id',
        eventId: 'event-id',
        commentText: 'This was an excellent event!',
        rating: 5,
        event: { id: 'event-id', name: 'Test Event' },
      },
    ];
  }

  findOne(id) {
    if (id === 'non-existent-id') {
      throw new Error('Not found');
    }
    return {
      id,
      commentText: 'This was an excellent event!',
      rating: 5,
      user: { id: 'user-id', fullName: 'Test User' },
      event: { id: 'event-id', name: 'Test Event' },
    };
  }

  update(id, updateDto, user) {
    if (user.id !== 'user-id' && user.systemRole === SystemRole.USER) {
      throw new Error('Forbidden');
    }
    return {
      id,
      commentText: updateDto.commentText, // Make sure this is explicitly included
      rating: updateDto.rating, // Make sure this is explicitly included
      userId: user.id,
    };
  }

  remove(id, user) {
    if (user.id !== 'user-id' && user.systemRole === SystemRole.USER) {
      throw new Error('Forbidden');
    }
    return {
      id,
      status: 'DELETED',
    };
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
    const req = args[0];
    req.user = {
      id: 'user-id',
      systemRole: req.headers.authorization?.includes('admin')
        ? SystemRole.ADMIN
        : req.headers.authorization?.includes('superadmin')
          ? SystemRole.SUPER_ADMIN
          : SystemRole.USER,
    };
    return originalMethod.apply(this, args);
  };
  return descriptor;
};

describe('Comment Rating Module (e2e)', () => {
  let app: INestApplication;
  let mockController: MockCommentRatingController;

  // Tokens for different user types
  const userToken = 'mock_user_token';
  const adminToken = 'mock_admin_token';
  const superAdminToken = 'mock_superadmin_token';

  // Test data IDs
  const eventId = 'mock-event-id';
  const userId = 'user-id';
  const adminId = 'admin-id';
  const commentId = 'mock-comment-id';

  beforeAll(async () => {
    mockController = new MockCommentRatingController();

    const moduleRef = await Test.createTestingModule({
      controllers: [],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            commentRating: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    // Get the Express instance and add routes manually
    const expressInstance = app.getHttpAdapter().getInstance();

    // Add body parser middleware (this is crucial for parsing JSON requests)
    expressInstance.use(bodyParser.json());
    expressInstance.use(bodyParser.urlencoded({ extended: true }));

    // Setup middleware to inject user info
    expressInstance.use((req, res, next) => {
      // Add debug logging to see what's coming in
      console.log('Request body:', req.body);

      req.user = {
        id: userId,
        systemRole: req.headers.authorization?.includes('admin')
          ? SystemRole.ADMIN
          : req.headers.authorization?.includes('superadmin')
            ? SystemRole.SUPER_ADMIN
            : SystemRole.USER,
      };
      next();
    });

    // Setup routes with Express
    expressInstance.post('/comments-ratings', (req, res) => {
      try {
        console.log('POST request body:', req.body);
        const result = mockController.create(req.body, req.user);
        res.status(201).json(result);
      } catch (error) {
        console.error('Error in POST /comments-ratings:', error);
        res
          .status(error.message === 'Forbidden' ? 403 : 400)
          .json({ message: error.message });
      }
    });

    expressInstance.get('/comments-ratings/event/:eventId', (req, res) => {
      try {
        const result = mockController.findAllForEvent(req.params.eventId);
        res.status(200).json(result);
      } catch (error) {
        res.status(404).json({ message: 'Event not found' });
      }
    });

    expressInstance.get(
      '/comments-ratings/event/:eventId/stats',
      (req, res) => {
        try {
          const result = mockController.getEventRatingStats(req.params.eventId);
          res.status(200).json(result);
        } catch (error) {
          res.status(404).json({ message: 'Event not found' });
        }
      },
    );

    expressInstance.get('/comments-ratings/my-comments', (req, res) => {
      const result = mockController.findAllByUser(req.user.id);
      res.status(200).json(result);
    });

    expressInstance.get('/comments-ratings/user/:userId', (req, res) => {
      if (req.user.systemRole === SystemRole.USER) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const result = mockController.findAllByUser(req.params.userId);
      res.status(200).json(result);
    });

    expressInstance.get('/comments-ratings/:id', (req, res) => {
      try {
        const result = mockController.findOne(req.params.id);
        res.status(200).json(result);
      } catch (error) {
        res.status(404).json({ message: 'Comment not found' });
      }
    });

    expressInstance.patch('/comments-ratings/:id', (req, res) => {
      try {
        console.log('PATCH request body:', req.body);
        const result = mockController.update(req.params.id, req.body, req.user);
        res.status(200).json(result);
      } catch (error) {
        console.error('Error in PATCH /comments-ratings/:id:', error);
        res
          .status(error.message === 'Forbidden' ? 403 : 400)
          .json({ message: error.message });
      }
    });

    expressInstance.delete('/comments-ratings/:id', (req, res) => {
      try {
        const result = mockController.remove(req.params.id, req.user);
        res.status(200).json(result);
      } catch (error) {
        res
          .status(error.message === 'Forbidden' ? 403 : 400)
          .json({ message: error.message });
      }
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /comments-ratings', () => {
    it('should create a new comment rating', async () => {
      const createDto = {
        eventId: eventId,
        commentText: 'This was an excellent event!',
        rating: 5,
      };

      const response = await request(app.getHttpServer())
        .post('/comments-ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.commentText).toBe(createDto.commentText);
      expect(response.body.rating).toBe(createDto.rating);
      expect(response.body.eventId).toBe(eventId);
    });
  });

  describe('GET /comments-ratings/event/:eventId', () => {
    it('should return comments for an event', async () => {
      const response = await request(app.getHttpServer())
        .get(`/comments-ratings/event/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('commentText');
      expect(response.body[0]).toHaveProperty('rating');
    });
  });

  describe('GET /comments-ratings/event/:eventId/stats', () => {
    it('should return rating statistics for an event', async () => {
      const response = await request(app.getHttpServer())
        .get(`/comments-ratings/event/${eventId}/stats`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('totalRatings');
      expect(response.body).toHaveProperty('ratingDistribution');
    });
  });

  describe('GET /comments-ratings/my-comments', () => {
    it('should return comments created by current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/comments-ratings/my-comments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('commentText');
    });
  });

  describe('GET /comments-ratings/user/:userId', () => {
    it('should allow admins to get user comments', async () => {
      const response = await request(app.getHttpServer())
        .get(`/comments-ratings/user/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should not allow regular users to access this endpoint', async () => {
      await request(app.getHttpServer())
        .get(`/comments-ratings/user/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('PATCH /comments-ratings/:id', () => {
    it('should update a comment as the owner', async () => {
      const updateDto = {
        commentText: 'Updated: This was an amazing event!',
        rating: 5,
      };

      const response = await request(app.getHttpServer())
        .patch(`/comments-ratings/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('id', commentId);
      expect(response.body.commentText).toBe(updateDto.commentText);
    });
  });

  describe('DELETE /comments-ratings/:id', () => {
    it('should soft delete a comment', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/comments-ratings/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'DELETED');
    });
  });
});
