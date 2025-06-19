import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AttendanceStatus, EventStatus, SystemRole } from '@prisma/client';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { AttendancePermissionService } from '../attendance-permission.service';

export interface CheckInResult {
  success: boolean;
  userId: string;
  attendanceId?: string;
  userName?: string;
  error?: string;
}

export interface BulkOperationResult {
  eventId: string;
  successCount: number;
  failedCount: number;
  results: CheckInResult[];
}

@Injectable()
export class AttendanceBulkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: AttendancePermissionService,
  ) {}

  /**
   * Bulk check-in attendees
   */
  async bulkCheckIn(
    eventId: string,
    userIds: string[],
    currentUserId: string,
    userRole: SystemRole,
  ): Promise<BulkOperationResult> {
    // Check permissions
    const hasPermission = await this.permissionService.checkPermission(
      eventId,
      currentUserId,
      userRole,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to check in attendees for this event',
      );
    }

    // ✅ FIXED: Validate event exists and get event data
    const event = await this.permissionService.validateEventAccess(eventId);
    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException(
        'Cannot check in attendees for events that are not currently active',
      );
    }

    // Process bulk check-in
    const results = await this.processBulkCheckIn(eventId, userIds);

    return {
      eventId,
      successCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Bulk register attendees
   */
  async bulkRegister(
    eventId: string,
    userIds: string[],
    currentUserId: string,
    userRole: SystemRole,
    status: AttendanceStatus = AttendanceStatus.JOINED,
  ): Promise<BulkOperationResult> {
    // Check permissions
    const hasPermission = await this.permissionService.checkPermission(
      eventId,
      currentUserId,
      userRole,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to register attendees for this event',
      );
    }

    // ✅ FIXED: Validate event exists and get event data
    const event = await this.permissionService.validateEventAccess(eventId);
    if (event.status === EventStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot register attendees for a completed event',
      );
    }

    // Process bulk registration
    const results = await this.processBulkRegistration(
      eventId,
      userIds,
      status,
    );

    return {
      eventId,
      successCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Bulk update attendance status
   */
  async bulkUpdateStatus(
    eventId: string,
    userIds: string[],
    status: AttendanceStatus,
    currentUserId: string,
    userRole: SystemRole,
    notes?: string,
  ): Promise<BulkOperationResult> {
    // Check permissions
    const hasPermission = await this.permissionService.checkPermission(
      eventId,
      currentUserId,
      userRole,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to update attendance for this event',
      );
    }

    // Validate event exists
    await this.permissionService.validateEventAccess(eventId);

    // Process bulk status update
    const results = await this.processBulkStatusUpdate(
      eventId,
      userIds,
      status,
      currentUserId,
      notes,
    );

    return {
      eventId,
      successCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**************************************
   * PRIVATE HELPER METHODS
   **************************************/

  private async processBulkCheckIn(
    eventId: string,
    userIds: string[],
  ): Promise<CheckInResult[]> {
    const results: CheckInResult[] = [];

    for (const userId of userIds) {
      try {
        const result = await this.prisma.eventAttendance.upsert({
          where: {
            userId_eventId: { userId, eventId },
          },
          update: {
            status: AttendanceStatus.JOINED,
            checkedInAt: new Date(),
          },
          create: {
            userId,
            eventId,
            status: AttendanceStatus.JOINED,
            checkedInAt: new Date(),
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

    return results;
  }

  private async processBulkRegistration(
    eventId: string,
    userIds: string[],
    status: AttendanceStatus,
  ): Promise<CheckInResult[]> {
    const results: CheckInResult[] = [];

    for (const userId of userIds) {
      try {
        // Check if user exists
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, fullName: true, email: true },
        });

        if (!user) {
          results.push({
            success: false,
            userId,
            error: 'User not found',
          });
          continue;
        }

        const result = await this.prisma.eventAttendance.upsert({
          where: {
            userId_eventId: { userId, eventId },
          },
          update: {
            status,
          },
          create: {
            userId,
            eventId,
            status,
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

    return results;
  }

  private async processBulkStatusUpdate(
    eventId: string,
    userIds: string[],
    status: AttendanceStatus,
    updatedBy: string,
    notes?: string,
  ): Promise<CheckInResult[]> {
    const results: CheckInResult[] = [];

    for (const userId of userIds) {
      try {
        const updateData: any = {
          status,
          updatedBy,
        };

        if (notes) {
          updateData.notes = notes;
        }

        // Set timestamps based on status
        if (status === AttendanceStatus.JOINED) {
          updateData.checkedInAt = new Date();
        } else if (status === AttendanceStatus.LEFT_EARLY) {
          updateData.checkedOutAt = new Date();
        }

        const result = await this.prisma.eventAttendance.update({
          where: {
            userId_eventId: { userId, eventId },
          },
          data: updateData,
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

    return results;
  }
}
