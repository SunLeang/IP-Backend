import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { AttendanceQueryDto } from '../dto/attendance-query.dto';
import { AttendancePermissionService } from './attendance-permission.service';

@Injectable()
export class AttendanceQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: AttendancePermissionService,
  ) {}

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
    const hasPermission = await this.permissionService.checkPermission(
      eventId,
      currentUserId,
      userRole,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to view attendees for this event',
      );
    }

    // Validate event exists
    await this.permissionService.validateEventAccess(eventId);

    // Build where clause for filtering
    const where = this.buildWhereClause(eventId, status, search);

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
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
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
   * Get attendance details by composite ID
   */
  async findOne(id: string, currentUserId: string, userRole: SystemRole) {
    // Parse the composite key
    const [userId, eventId] = this.parseCompositeId(id);

    // Check permissions
    const hasPermission = await this.permissionService.checkPermission(
      eventId,
      currentUserId,
      userRole,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to view this attendance record',
      );
    }

    // Find the attendance record using composite key
    const attendance = await this.prisma.eventAttendance.findUnique({
      where: {
        userId_eventId: { userId, eventId },
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
      throw new NotFoundException('Attendance record not found');
    }

    return attendance;
  }

  /**
   * ✅ FIXED: Check if user has attended a specific event
   * This should be accessible to any authenticated user for their own status
   */
  async checkUserAttendanceStatus(
    userId: string,
    eventId: string,
  ): Promise<{
    hasAttended: boolean;
    attendanceStatus?: string;
    checkedInAt?: Date;
    eventStatus: string;
  }> {
    try {
      console.log(
        `🔍 Checking attendance for user ${userId} on event ${eventId}`,
      );

      // ✅ SIMPLIFIED: Use the new self-check permission method
      const hasPermission =
        await this.permissionService.checkSelfAttendancePermission(
          eventId,
          userId,
        );

      if (!hasPermission) {
        console.log(`❌ Permission denied for self-check`);
        return {
          hasAttended: false,
          attendanceStatus: 'NO_PERMISSION',
          eventStatus: 'UNKNOWN',
        };
      }

      // Get event details
      const event = await this.prisma.event.findUnique({
        where: { id: eventId, deletedAt: null },
        select: {
          id: true,
          status: true,
          dateTime: true,
        },
      });

      if (!event) {
        console.log(`❌ Event ${eventId} not found`);
        return {
          hasAttended: false,
          attendanceStatus: 'EVENT_NOT_FOUND',
          eventStatus: 'NOT_FOUND',
        };
      }

      // Check attendance record - this should never throw an error
      const attendance = await this.prisma.eventAttendance.findUnique({
        where: {
          userId_eventId: { userId, eventId },
        },
        select: {
          status: true,
          checkedInAt: true,
        },
      });

      // Log results
      console.log(`✅ Attendance check completed:`, {
        userId,
        eventId,
        hasAttendance: !!attendance,
        attendanceStatus: attendance?.status || 'NOT_REGISTERED',
        hasAttended: attendance?.status === 'JOINED',
        eventStatus: event.status,
      });

      return {
        hasAttended: attendance?.status === 'JOINED',
        attendanceStatus: attendance?.status || 'NOT_REGISTERED',
        checkedInAt: attendance?.checkedInAt || undefined,
        eventStatus: event.status,
      };
    } catch (error) {
      console.error('❌ Error in checkUserAttendanceStatus:', error);

      // Return safe defaults instead of throwing
      return {
        hasAttended: false,
        attendanceStatus: 'ERROR',
        eventStatus: 'UNKNOWN',
      };
    }
  }

  /**
   * Build where clause for filtering attendees
   */
  private buildWhereClause(eventId: string, status?: any, search?: string) {
    const where: any = { eventId };

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

    return where;
  }

  /**
   * Parse composite ID format "userId:eventId"
   */
  private parseCompositeId(id: string): [string, string] {
    const [userId, eventId] = id.split(':');

    if (!userId || !eventId) {
      throw new BadRequestException(
        'Invalid attendance ID format - must be "userId:eventId"',
      );
    }

    return [userId, eventId];
  }
}
