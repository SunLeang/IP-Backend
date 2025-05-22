import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { AttendanceStatus, EventStatus, SystemRole } from '@prisma/client';

export interface CheckInResult {
  success: boolean;
  userId: string;
  attendanceId?: string;
  userName?: string;
  error?: string;
}

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user has permission to access the attendance data
   * - Event organizer
   * - Volunteer of the event
   * - Admin/SuperAdmin
   * - Self-registration
   */
  private async checkPermission(
    eventId: string,
    userId: string,
    userRole: SystemRole,
    targetUserId?: string,
  ): Promise<boolean> {
    // SuperAdmin always has access
    if (userRole === SystemRole.SUPER_ADMIN) {
      return true;
    }

    // Check if user is the event organizer
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: { organizerId: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // User is the organizer
    if (event.organizerId === userId) {
      return true;
    }

    // Regular admin has access
    if (userRole === SystemRole.ADMIN) {
      return true;
    }

    // Allow self-registration: user can register themselves
    if (targetUserId && userId === targetUserId) {
      return true;
    }

    // Check if user is a volunteer for this event
    const isVolunteer = await this.prisma.eventVolunteer.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
        status: 'APPROVED',
      },
    });

    return !!isVolunteer;
  }

  /**
   * Register a new attendee for an event
   */
  async register(
    createAttendanceDto: CreateAttendanceDto,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    const {
      eventId,
      userId,
      status = AttendanceStatus.JOINED,
      notes,
    } = createAttendanceDto;

    // Check permissions
    const hasPermission = await this.checkPermission(
      eventId,
      currentUserId,
      userRole,
      userId,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to register attendees for this event',
      );
    }

    // Check if event exists and is not already completed
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (event.status === EventStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot register attendees for a completed event',
      );
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if attendance record already exists
    const existingAttendance = await this.prisma.eventAttendance.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existingAttendance) {
      // Update existing attendance instead
      return this.prisma.eventAttendance.update({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
        data: {
          status,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              username: true,
            },
          },
        },
      });
    }

    // Create new attendance record
    return this.prisma.eventAttendance.create({
      data: {
        user: { connect: { id: userId } },
        event: { connect: { id: eventId } },
        status,
        // Remove notes if it's not in the schema
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Get all attendees for an event with filtering and pagination
   */
  async findAllByEvent(
    eventId: string,
    query: AttendanceQueryDto,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    const { status, search, skip = 0, take = 100 } = query;

    // Check permissions
    const hasPermission = await this.checkPermission(
      eventId,
      currentUserId,
      userRole,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to view attendees for this event',
      );
    }

    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Build where clause for filtering
    const where: any = {
      eventId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Get attendees with pagination
    const [attendees, total] = await Promise.all([
      this.prisma.eventAttendance.findMany({
        where,
        skip: Number(skip),
        take: Number(take),
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              username: true,
              gender: true,
              age: true,
              org: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' },
          { updatedAt: 'desc' }, // Replace with valid fields from your schema
        ],
      }),
      this.prisma.eventAttendance.count({ where }),
    ]);

    // Return attendees with pagination metadata
    return {
      data: attendees,
      meta: {
        total,
        skip: Number(skip),
        take: Number(take),
        hasMore: Number(skip) + Number(take) < total,
      },
    };
  }

  /**
   * Get attendance details by ID
   */
  async findOne(id: string, currentUserId: string, userRole: SystemRole) {
    // Parse the composite key from the id parameter
    const [userId, eventId] = id.split(':');

    if (!userId || !eventId) {
      throw new BadRequestException(
        'Invalid attendance ID format - must be "userId:eventId"',
      );
    }

    // Find the attendance record using composite key
    const attendance = await this.prisma.eventAttendance.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            username: true,
            gender: true,
            age: true,
            org: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            dateTime: true,
            organizerId: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance record not found`);
    }

    // Check permissions
    const hasPermission = await this.checkPermission(
      eventId,
      currentUserId,
      userRole,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to view this attendance record',
      );
    }

    return attendance;
  }

  /**
   * Update attendance status (check-in, etc.)
   */
  async update(
    id: string,
    updateAttendanceDto: UpdateAttendanceDto,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    // Parse the composite key from the id parameter
    const [userId, eventId] = id.split(':');

    if (!userId || !eventId) {
      throw new BadRequestException(
        'Invalid attendance ID format - must be "userId:eventId"',
      );
    }

    // Find attendance record first using composite key
    const attendance = await this.prisma.eventAttendance.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            organizerId: true,
            status: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance record not found`);
    }

    // Check permissions
    const hasPermission = await this.checkPermission(
      eventId,
      currentUserId,
      userRole,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to update this attendance record',
      );
    }

    // If checking in, validate event status
    if (
      updateAttendanceDto.status === AttendanceStatus.JOINED &&
      attendance.event.status !== EventStatus.PUBLISHED
    ) {
      throw new BadRequestException(
        'Cannot check in attendees for events that are not currently active',
      );
    }

    // Prepare update data
    const updateData: any = {
      ...updateAttendanceDto,
      updatedBy: currentUserId,
    };

    // If we're checking in and there's no check-in time yet, set it
    if (
      updateAttendanceDto.status === AttendanceStatus.JOINED &&
      !updateAttendanceDto.checkedInAt &&
      !attendance.checkedInAt
    ) {
      updateData.checkedInAt = new Date();
    }

    return this.prisma.eventAttendance.update({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            username: true,
          },
        },
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
   * Delete attendance record
   */
  async remove(id: string, currentUserId: string, userRole: SystemRole) {
    // Parse the composite key from the id parameter
    const [userId, eventId] = id.split(':');

    if (!userId || !eventId) {
      throw new BadRequestException(
        'Invalid attendance ID format - must be "userId:eventId"',
      );
    }

    // Find attendance record first
    const attendance = await this.prisma.eventAttendance.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            organizerId: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance record not found`);
    }

    // For delete, only organizer and admin/superadmin can delete
    const isOrganizer = attendance.event.organizerId === currentUserId;
    const isAdmin =
      userRole === SystemRole.ADMIN || userRole === SystemRole.SUPER_ADMIN;

    if (!isOrganizer && !isAdmin) {
      throw new ForbiddenException(
        'Only event organizers and administrators can delete attendance records',
      );
    }

    // Hard delete the attendance record
    return this.prisma.eventAttendance.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });
  }

  /**
   * Get attendance statistics for an event
   */
  async getEventAttendanceStats(
    eventId: string,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    // Check permissions
    const hasPermission = await this.checkPermission(
      eventId,
      currentUserId,
      userRole,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to view attendance statistics for this event',
      );
    }

    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Get attendance stats
    const statusCounts = await this.prisma.eventAttendance.groupBy({
      by: ['status'],
      where: { eventId },
      _count: {
        status: true,
      },
    });

    // Transform the result into a more usable format
    const stats = {
      total: 0,
      joined: 0,
      leftEarly: 0,
      noShow: 0,
    };

    // Count by status
    statusCounts.forEach((item) => {
      const count = item._count.status;
      stats.total += count;

      switch (item.status) {
        case AttendanceStatus.JOINED:
          stats.joined = count;
          break;
        case AttendanceStatus.LEFT_EARLY:
          stats.leftEarly = count;
          break;
        case AttendanceStatus.NO_SHOW:
          stats.noShow = count;
          break;
      }
    });

    return stats;
  }

  /**
   * Bulk check-in attendees by QR code or name
   */
  async bulkCheckIn(
    eventId: string,
    userIds: string[],
    currentUserId: string,
    userRole: SystemRole,
  ) {
    // Check permissions
    const hasPermission = await this.checkPermission(
      eventId,
      currentUserId,
      userRole,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to check in attendees for this event',
      );
    }

    // Check if event exists and is ongoing
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException(
        'Cannot check in attendees for events that are not currently active',
      );
    }

    // Update attendance records for all provided users
    const now = new Date();
    const results: CheckInResult[] = [];

    for (const userId of userIds) {
      try {
        const result = await this.prisma.eventAttendance.upsert({
          where: {
            userId_eventId: {
              userId,
              eventId,
            },
          },
          update: {
            status: AttendanceStatus.JOINED,
            // Remove fields that don't exist
          },
          create: {
            userId,
            eventId,
            status: AttendanceStatus.JOINED,
            // Remove fields that don't exist
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

        results.push({
          success: true,
          userId,
          // Properly format the composite ID
          attendanceId: `${userId}:${eventId}`,
          userName: result.user.fullName,
        });
      } catch (error) {
        results.push({
          success: false,
          userId,
          error: error.message,
        });
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
