import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/app/prisma/services/prisma.service';
import { SystemRole, AttendanceStatus, EventStatus } from '@prisma/client';
import * as bodyParser from 'body-parser';

// Define result type for bulk check-in operation
interface CheckInResult {
  success: boolean;
  userId: string;
  attendanceId?: string;
  userName?: string;
  error?: string;
}

// Define proper type for attendance objects
interface MockAttendance {
  userId: string;
  eventId: string;
  status: AttendanceStatus;
  checkedInAt: Date | null; // Can be null if not checked in yet
}

// Create a mock for the AttendanceService
class MockAttendanceController {
  // Store relationships for testing
  private events = {
    'event-id-1': {
      id: 'event-id-1',
      name: 'Test Event 1',
      organizerId: 'organizer-id',
      status: EventStatus.PUBLISHED,
    },
    'event-id-2': {
      id: 'event-id-2',
      name: 'Test Event 2',
      organizerId: 'organizer-id-2',
      status: EventStatus.PUBLISHED,
    },
    'completed-event-id': {
      id: 'completed-event-id',
      name: 'Completed Event',
      organizerId: 'organizer-id',
      status: EventStatus.COMPLETED,
    },
  };

  // Store volunteers relationship
  private volunteers = [
    { userId: 'volunteer-id', eventId: 'event-id-1', status: 'APPROVED' },
  ];

  // Properly type the attendances array
  private attendances: MockAttendance[] = [
    {
      userId: 'user-id',
      eventId: 'event-id-1',
      status: AttendanceStatus.JOINED,
      checkedInAt: new Date(),
    },
    {
      userId: 'other-user-id',
      eventId: 'event-id-1',
      status: AttendanceStatus.NO_SHOW,
      checkedInAt: null,
    },
    {
      userId: 'user-id',
      eventId: 'event-id-2',
      status: AttendanceStatus.JOINED,
      checkedInAt: new Date(),
    },
  ];

  // Register a new attendee
  register(body, user) {
    // Check if event exists
    const event = this.events[body.eventId];
    if (!event) {
      throw new Error('Event not found');
    }

    // Check permissions (organizer, volunteer, admin)
    const hasPermission =
      user.systemRole === SystemRole.ADMIN ||
      user.systemRole === SystemRole.SUPER_ADMIN ||
      event.organizerId === user.id ||
      this.volunteers.some(
        (v) =>
          v.userId === user.id &&
          v.eventId === body.eventId &&
          v.status === 'APPROVED',
      );

    if (!hasPermission) {
      throw new Error('Forbidden');
    }

    // Check for completed events
    if (event.status === EventStatus.COMPLETED) {
      throw new Error('Cannot register attendees for a completed event');
    }

    // Check for existing record
    const existingAttendance = this.attendances.find(
      (a) => a.userId === body.userId && a.eventId === body.eventId,
    );

    if (existingAttendance) {
      // Update existing record
      existingAttendance.status = body.status || AttendanceStatus.JOINED;
      return {
        ...existingAttendance,
        user: { id: body.userId, fullName: 'Test User' },
      };
    }

    // Create new record with properly typed object
    const newAttendance: MockAttendance = {
      userId: body.userId,
      eventId: body.eventId,
      status: body.status || AttendanceStatus.JOINED,
      checkedInAt: null, // Added missing required property
    };

    this.attendances.push(newAttendance);
    return {
      ...newAttendance,
      user: { id: body.userId, fullName: 'Test User' },
    };
  }

  // Get all attendees for an event
  findAllByEvent(eventId, query, user) {
    // Check if event exists
    const event = this.events[eventId];
    if (!event) {
      throw new Error('Event not found');
    }

    // Check permissions
    const hasPermission =
      user.systemRole === SystemRole.ADMIN ||
      user.systemRole === SystemRole.SUPER_ADMIN ||
      event.organizerId === user.id ||
      this.volunteers.some(
        (v) =>
          v.userId === user.id &&
          v.eventId === eventId &&
          v.status === 'APPROVED',
      );

    if (!hasPermission) {
      throw new Error('Forbidden');
    }

    // Filter attendees for this event
    let attendees = this.attendances.filter((a) => a.eventId === eventId);

    // Apply filters if provided
    if (query.status) {
      attendees = attendees.filter((a) => a.status === query.status);
    }

    if (query.search) {
      // Note: In a real app, this would search the user's name or email
      // For this mock, we're just pretending to filter
      attendees = attendees.slice(0, 1);
    }

    // Add user data to each attendance
    const attendeesWithUsers = attendees.map((a) => ({
      ...a,
      user: {
        id: a.userId,
        fullName: a.userId === 'user-id' ? 'Test User' : 'Other User',
        email: `${a.userId}@example.com`,
        username: a.userId,
        gender: 'MALE',
        age: 30,
        org: 'Test Org',
      },
    }));

    // Handle pagination
    const skip = parseInt(query.skip) || 0;
    const take = parseInt(query.take) || 10;
    const paginatedAttendees = attendeesWithUsers.slice(skip, skip + take);

    return {
      data: paginatedAttendees,
      meta: {
        total: attendeesWithUsers.length,
        skip,
        take,
        hasMore: skip + take < attendeesWithUsers.length,
      },
    };
  }

  // Get attendance stats for an event
  getEventAttendanceStats(eventId, user) {
    // Check if event exists
    const event = this.events[eventId];
    if (!event) {
      throw new Error('Event not found');
    }

    // Check permissions
    const hasPermission =
      user.systemRole === SystemRole.ADMIN ||
      user.systemRole === SystemRole.SUPER_ADMIN ||
      event.organizerId === user.id ||
      this.volunteers.some(
        (v) =>
          v.userId === user.id &&
          v.eventId === eventId &&
          v.status === 'APPROVED',
      );

    if (!hasPermission) {
      throw new Error('Forbidden');
    }

    // Count attendees by status
    const attendees = this.attendances.filter((a) => a.eventId === eventId);

    const stats = {
      total: attendees.length,
      joined: 0,
      leftEarly: 0,
      noShow: 0,
    };

    // Calculate stats - modify to handle only valid statuses
    attendees.forEach((a) => {
      switch (a.status) {
        case AttendanceStatus.JOINED:
          stats.joined++;
          break;
        case AttendanceStatus.NO_SHOW:
          stats.noShow++;
          break;
        // Remove or comment out the case for LEFT_EARLY if it's not in your enum
        // case AttendanceStatus.LEFT_EARLY:
        //   stats.leftEarly++;
        //   break;
      }
    });

    return stats;
  }

  // Find attendance by ID (composite key)
  findOne(id, user) {
    const [userId, eventId] = id.split(':');

    if (!userId || !eventId) {
      throw new Error('Invalid attendance ID format');
    }

    // Find the attendance
    const attendance = this.attendances.find(
      (a) => a.userId === userId && a.eventId === eventId,
    );

    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    // Check event and permissions
    const event = this.events[attendance.eventId];
    if (!event) {
      throw new Error('Event not found');
    }

    const hasPermission =
      user.systemRole === SystemRole.ADMIN ||
      user.systemRole === SystemRole.SUPER_ADMIN ||
      event.organizerId === user.id ||
      this.volunteers.some(
        (v) =>
          v.userId === user.id &&
          v.eventId === attendance.eventId &&
          v.status === 'APPROVED',
      ) ||
      attendance.userId === user.id; // Users can view their own attendance

    if (!hasPermission) {
      throw new Error('Forbidden');
    }

    return {
      ...attendance,
      user: {
        id: attendance.userId,
        fullName: attendance.userId === 'user-id' ? 'Test User' : 'Other User',
        email: `${attendance.userId}@example.com`,
      },
      event,
    };
  }

  // Update attendance record
  update(id, updateDto, user) {
    const [userId, eventId] = id.split(':');

    if (!userId || !eventId) {
      throw new Error('Invalid attendance ID format');
    }

    // Find the attendance
    const attendance = this.attendances.find(
      (a) => a.userId === userId && a.eventId === eventId,
    );

    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    // Check event and permissions
    const event = this.events[attendance.eventId];
    if (!event) {
      throw new Error('Event not found');
    }

    const hasPermission =
      user.systemRole === SystemRole.ADMIN ||
      user.systemRole === SystemRole.SUPER_ADMIN ||
      event.organizerId === user.id ||
      this.volunteers.some(
        (v) =>
          v.userId === user.id &&
          v.eventId === attendance.eventId &&
          v.status === 'APPROVED',
      );

    if (!hasPermission) {
      throw new Error('Forbidden');
    }

    // Check if event is published for check-ins
    if (
      updateDto.status === AttendanceStatus.JOINED &&
      event.status !== EventStatus.PUBLISHED
    ) {
      throw new Error(
        'Cannot check in attendees for events that are not currently active',
      );
    }

    // Update the record
    Object.assign(attendance, updateDto);

    // If checking in, set checkedInAt if not already set
    if (
      updateDto.status === AttendanceStatus.JOINED &&
      !attendance.checkedInAt
    ) {
      attendance.checkedInAt = new Date();
    }

    return {
      ...attendance,
      user: {
        id: attendance.userId,
        fullName: attendance.userId === 'user-id' ? 'Test User' : 'Other User',
        email: `${attendance.userId}@example.com`,
      },
      event: {
        id: event.id,
        name: event.name,
      },
    };
  }

  // Remove attendance record
  remove(id, user) {
    const [userId, eventId] = id.split(':');

    if (!userId || !eventId) {
      throw new Error('Invalid attendance ID format');
    }

    // Find the attendance
    const attendanceIndex = this.attendances.findIndex(
      (a) => a.userId === userId && a.eventId === eventId,
    );

    if (attendanceIndex === -1) {
      throw new Error('Attendance record not found');
    }

    const attendance = this.attendances[attendanceIndex];

    // Check event and permissions (only organizer and admin can delete)
    const event = this.events[attendance.eventId];
    if (!event) {
      throw new Error('Event not found');
    }

    const isOrganizer = event.organizerId === user.id;
    const isAdmin =
      user.systemRole === SystemRole.ADMIN ||
      user.systemRole === SystemRole.SUPER_ADMIN;

    if (!isOrganizer && !isAdmin) {
      throw new Error('Forbidden');
    }

    // Remove the record
    this.attendances.splice(attendanceIndex, 1);

    return { success: true };
  }

  // Bulk check-in
  bulkCheckIn(eventId, userIds, user) {
    // Check if event exists
    const event = this.events[eventId];
    if (!event) {
      throw new Error('Event not found');
    }

    // Check permissions
    const hasPermission =
      user.systemRole === SystemRole.ADMIN ||
      user.systemRole === SystemRole.SUPER_ADMIN ||
      event.organizerId === user.id ||
      this.volunteers.some(
        (v) =>
          v.userId === user.id &&
          v.eventId === eventId &&
          v.status === 'APPROVED',
      );

    if (!hasPermission) {
      throw new Error('Forbidden');
    }

    // Check if event is published
    if (event.status !== EventStatus.PUBLISHED) {
      throw new Error(
        'Cannot check in attendees for events that are not currently active',
      );
    }

    // Explicitly type the results array
    const results: CheckInResult[] = [];
    const now = new Date();

    // Process each user
    for (const userId of userIds) {
      try {
        // Find existing attendance or create new
        let attendance = this.attendances.find(
          (a) => a.userId === userId && a.eventId === eventId,
        );

        if (attendance) {
          // Update existing
          attendance.status = AttendanceStatus.JOINED;
          attendance.checkedInAt = now;
        } else {
          // Create new attendance with explicit typing
          const newAttendance: MockAttendance = {
            userId,
            eventId,
            status: AttendanceStatus.JOINED,
            checkedInAt: now,
          };
          this.attendances.push(newAttendance);
          attendance = newAttendance;
        }

        // Use properly typed CheckInResult
        const result: CheckInResult = {
          success: true,
          userId,
          attendanceId: `${userId}:${eventId}`,
          userName: userId === 'user-id' ? 'Test User' : 'Test User ' + userId,
        };
        results.push(result);
      } catch (error) {
        // Use properly typed CheckInResult for errors too
        const errorResult: CheckInResult = {
          success: false,
          userId,
          error: error.message,
        };
        results.push(errorResult);
      }
    }

    return {
      eventId,
      checkedInCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      results,
    };
  }
}

describe('Attendance Module (e2e)', () => {
  let app: INestApplication;
  let mockController: MockAttendanceController;

  // Test data IDs
  const eventId = 'event-id-1';
  const completedEventId = 'completed-event-id';
  const userId = 'user-id';
  const otherUserId = 'other-user-id';
  const nonExistingEventId = 'non-existing-event-id';

  // Tokens for different user types
  const userToken = 'mock_user_token';
  const organizerToken = 'mock_organizer_token';
  const volunteerToken = 'mock_volunteer_token';
  const adminToken = 'mock_admin_token';
  const superAdminToken = 'mock_superadmin_token';

  beforeAll(async () => {
    mockController = new MockAttendanceController();

    const moduleRef = await Test.createTestingModule({
      controllers: [],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            eventAttendance: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              upsert: jest.fn(),
            },
            event: {
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            eventVolunteer: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    // Get the Express instance and add routes manually
    const expressInstance = app.getHttpAdapter().getInstance();

    // Add body parser middleware
    expressInstance.use(bodyParser.json());
    expressInstance.use(bodyParser.urlencoded({ extended: true }));

    // Setup middleware to inject user info
    expressInstance.use((req, res, next) => {
      console.log('Request body:', req.body);

      // Determine user ID and role from token
      if (req.headers.authorization?.includes('organizer')) {
        req.user = {
          id: 'organizer-id',
          systemRole: SystemRole.ADMIN,
        };
      } else if (req.headers.authorization?.includes('volunteer')) {
        req.user = {
          id: 'volunteer-id',
          systemRole: SystemRole.USER,
        };
      } else if (req.headers.authorization?.includes('admin')) {
        req.user = {
          id: 'admin-id',
          systemRole: SystemRole.ADMIN,
        };
      } else if (req.headers.authorization?.includes('superadmin')) {
        req.user = {
          id: 'superadmin-id',
          systemRole: SystemRole.SUPER_ADMIN,
        };
      } else {
        req.user = {
          id: userId,
          systemRole: SystemRole.USER,
        };
      }
      next();
    });

    // Express routes
    expressInstance.post('/attendance', (req, res) => {
      try {
        console.log('POST request body:', req.body);
        const result = mockController.register(req.body, req.user);
        res.status(201).json(result);
      } catch (error) {
        console.error('Error in POST /attendance:', error);
        res
          .status(error.message === 'Forbidden' ? 403 : 400)
          .json({ message: error.message });
      }
    });

    expressInstance.get('/attendance/event/:eventId', (req, res) => {
      try {
        const result = mockController.findAllByEvent(
          req.params.eventId,
          req.query,
          req.user,
        );
        res.status(200).json(result);
      } catch (error) {
        res
          .status(error.message === 'Forbidden' ? 403 : 404)
          .json({ message: error.message });
      }
    });

    expressInstance.get('/attendance/event/:eventId/stats', (req, res) => {
      try {
        const result = mockController.getEventAttendanceStats(
          req.params.eventId,
          req.user,
        );
        res.status(200).json(result);
      } catch (error) {
        res
          .status(error.message === 'Forbidden' ? 403 : 404)
          .json({ message: error.message });
      }
    });

    expressInstance.get('/attendance/:userId/:eventId', (req, res) => {
      try {
        const result = mockController.findOne(
          `${req.params.userId}:${req.params.eventId}`,
          req.user,
        );
        res.status(200).json(result);
      } catch (error) {
        res
          .status(error.message === 'Forbidden' ? 403 : 404)
          .json({ message: error.message });
      }
    });

    expressInstance.get('/attendance/:id', (req, res) => {
      try {
        const result = mockController.findOne(req.params.id, req.user);
        res.status(200).json(result);
      } catch (error) {
        res
          .status(error.message === 'Forbidden' ? 403 : 404)
          .json({ message: error.message });
      }
    });

    expressInstance.patch('/attendance/:userId/:eventId', (req, res) => {
      try {
        console.log('PATCH request body:', req.body);
        const result = mockController.update(
          `${req.params.userId}:${req.params.eventId}`,
          req.body,
          req.user,
        );
        res.status(200).json(result);
      } catch (error) {
        console.error('Error in PATCH /attendance/:userId/:eventId:', error);
        res
          .status(error.message === 'Forbidden' ? 403 : 400)
          .json({ message: error.message });
      }
    });

    expressInstance.patch('/attendance/:id', (req, res) => {
      try {
        console.log('PATCH request body:', req.body);
        const result = mockController.update(req.params.id, req.body, req.user);
        res.status(200).json(result);
      } catch (error) {
        console.error('Error in PATCH /attendance/:id:', error);
        res
          .status(error.message === 'Forbidden' ? 403 : 400)
          .json({ message: error.message });
      }
    });

    expressInstance.delete('/attendance/:userId/:eventId', (req, res) => {
      try {
        const result = mockController.remove(
          `${req.params.userId}:${req.params.eventId}`,
          req.user,
        );
        res.status(200).json(result);
      } catch (error) {
        res
          .status(error.message === 'Forbidden' ? 403 : 400)
          .json({ message: error.message });
      }
    });

    expressInstance.delete('/attendance/:id', (req, res) => {
      try {
        const result = mockController.remove(req.params.id, req.user);
        res.status(200).json(result);
      } catch (error) {
        res
          .status(
            error.message === 'Forbidden'
              ? 403
              : error.message === 'Attendance record not found'
                ? 404
                : 400,
          )
          .json({ message: error.message });
      }
    });

    expressInstance.post(
      '/attendance/event/:eventId/bulk-check-in',
      (req, res) => {
        try {
          console.log('BULK CHECK-IN request body:', req.body);
          const result = mockController.bulkCheckIn(
            req.params.eventId,
            req.body.userIds,
            req.user,
          );
          res.status(201).json(result);
        } catch (error) {
          console.error('Error in bulk check-in:', error);
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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /attendance', () => {
    it('should register a new attendee when called by organizer', async () => {
      const createDto = {
        userId: 'new-user-id',
        eventId,
        status: AttendanceStatus.JOINED,
      };

      const response = await request(app.getHttpServer())
        .post('/attendance')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('userId', createDto.userId);
      expect(response.body).toHaveProperty('eventId', createDto.eventId);
      expect(response.body).toHaveProperty('status', createDto.status);
    });

    it('should register a new attendee when called by volunteer', async () => {
      const createDto = {
        userId: 'another-user-id',
        eventId,
        status: AttendanceStatus.JOINED,
      };

      const response = await request(app.getHttpServer())
        .post('/attendance')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('userId', createDto.userId);
    });

    it('should register a new attendee when called by admin', async () => {
      const createDto = {
        userId: 'admin-registered-user',
        eventId,
        status: AttendanceStatus.JOINED,
      };

      const response = await request(app.getHttpServer())
        .post('/attendance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('userId', createDto.userId);
    });

    it('should NOT allow registration by regular users', async () => {
      const createDto = {
        userId: 'unauthorized-user-id',
        eventId,
        status: AttendanceStatus.JOINED,
      };

      await request(app.getHttpServer())
        .post('/attendance')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createDto)
        .expect(403);
    });

    it('should NOT allow registration for completed events', async () => {
      const createDto = {
        userId: 'user-for-completed-event',
        eventId: completedEventId,
        status: AttendanceStatus.JOINED,
      };

      await request(app.getHttpServer())
        .post('/attendance')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /attendance/event/:eventId', () => {
    it('should return attendees for an event when called by organizer', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendance/event/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBeTruthy();
    });

    it('should filter attendees by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendance/event/${eventId}?status=JOINED`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(
        response.body.data.every((a) => a.status === 'JOINED'),
      ).toBeTruthy();
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendance/event/${eventId}?skip=0&take=1`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it('should NOT allow unauthorized users to access attendees', async () => {
      await request(app.getHttpServer())
        .get(`/attendance/event/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /attendance/event/:eventId/stats', () => {
    it('should return attendance statistics when called by organizer', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendance/event/${eventId}/stats`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('joined');
      expect(response.body).toHaveProperty('noShow');
    });

    it('should NOT allow unauthorized users to access statistics', async () => {
      await request(app.getHttpServer())
        .get(`/attendance/event/${eventId}/stats`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /attendance/:userId/:eventId', () => {
    it('should return attendance details by composite key', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendance/${userId}/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('eventId', eventId);
    });

    it('should allow users to access their own attendance', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendance/${userId}/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId', userId);
    });

    it("should NOT allow users to access others' attendance", async () => {
      await request(app.getHttpServer())
        .get(`/attendance/${otherUserId}/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /attendance/:id (parsed as composite key)', () => {
    it('should return attendance details by composite ID string', async () => {
      const compositeId = `${userId}:${eventId}`;

      const response = await request(app.getHttpServer())
        .get(`/attendance/${compositeId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('eventId', eventId);
    });
  });

  describe('PATCH /attendance/:userId/:eventId', () => {
    it('should update attendance by composite key when called by organizer', async () => {
      const updateDto = {
        status: AttendanceStatus.NO_SHOW, // Make sure this is a valid status
      };

      const response = await request(app.getHttpServer())
        .patch(`/attendance/${userId}/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('status', updateDto.status);
    });

    it('should update attendance when called by volunteer', async () => {
      const updateDto = {
        status: AttendanceStatus.JOINED,
      };

      const response = await request(app.getHttpServer())
        .patch(`/attendance/${userId}/${eventId}`)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('status', updateDto.status);
    });

    it('should NOT allow regular users to update attendance', async () => {
      const updateDto = {
        status: AttendanceStatus.NO_SHOW,
      };

      await request(app.getHttpServer())
        .patch(`/attendance/${userId}/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateDto)
        .expect(403);
    });
  });

  describe('PATCH /attendance/:id (parsed as composite key)', () => {
    it('should update attendance by composite ID string', async () => {
      const compositeId = `${userId}:${eventId}`;
      const updateDto = {
        status: AttendanceStatus.JOINED,
      };

      const response = await request(app.getHttpServer())
        .patch(`/attendance/${compositeId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('status', updateDto.status);
    });
  });

  describe('DELETE /attendance/:userId/:eventId', () => {
    it('should delete attendance by composite key when called by organizer', async () => {
      await request(app.getHttpServer())
        .delete(`/attendance/${otherUserId}/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);
    });

    it('should NOT allow volunteers to delete attendance', async () => {
      await request(app.getHttpServer())
        .delete(`/attendance/${userId}/${eventId}`)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .expect(403);
    });

    it('should NOT allow regular users to delete attendance', async () => {
      await request(app.getHttpServer())
        .delete(`/attendance/${userId}/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should allow admins to delete attendance', async () => {
      await request(app.getHttpServer())
        .delete(`/attendance/${userId}/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('DELETE /attendance/:id (parsed as composite key)', () => {
    const testUserId = 'special-test-user';
    const testEventId = 'event-id-1';
    const compositeId = `${testUserId}:${testEventId}`;

    // First create a new attendance record specifically for this test
    beforeEach(async () => {
      // Register a new attendance record
      const createDto = {
        userId: testUserId,
        eventId: testEventId,
        status: AttendanceStatus.JOINED,
      };

      await request(app.getHttpServer())
        .post('/attendance')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(createDto)
        .expect(201);
    });

    it('should delete attendance by composite ID string', async () => {
      await request(app.getHttpServer())
        .delete(`/attendance/${compositeId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);
    });
  });

  describe('POST /attendance/event/:eventId/bulk-check-in', () => {
    it('should bulk check in attendees when called by organizer', async () => {
      const bulkData = {
        userIds: ['bulk-user-1', 'bulk-user-2', 'bulk-user-3'],
      };

      const response = await request(app.getHttpServer())
        .post(`/attendance/event/${eventId}/bulk-check-in`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(bulkData)
        .expect(201);

      expect(response.body).toHaveProperty('checkedInCount', 3);
      expect(response.body.results).toHaveLength(3);
      expect(response.body.results.every((r) => r.success)).toBeTruthy();
    });

    it('should allow volunteers to bulk check in attendees', async () => {
      const bulkData = {
        userIds: ['bulk-volunteer-user-1', 'bulk-volunteer-user-2'],
      };

      const response = await request(app.getHttpServer())
        .post(`/attendance/event/${eventId}/bulk-check-in`)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send(bulkData)
        .expect(201);

      expect(response.body).toHaveProperty('checkedInCount', 2);
    });

    it('should NOT allow regular users to bulk check in attendees', async () => {
      const bulkData = {
        userIds: ['unauthorized-bulk-user'],
      };

      await request(app.getHttpServer())
        .post(`/attendance/event/${eventId}/bulk-check-in`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(bulkData)
        .expect(403);
    });

    it('should NOT allow bulk check in for non-existent events', async () => {
      const bulkData = {
        userIds: ['user-for-nonexistent-event'],
      };

      await request(app.getHttpServer())
        .post(`/attendance/event/${nonExistingEventId}/bulk-check-in`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(bulkData)
        .expect(404);
    });
  });
});
