import { Injectable, ForbiddenException } from '@nestjs/common';
import { AttendanceStatus, SystemRole } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { AttendancePermissionService } from './attendance-permission.service';

@Injectable()
export class AttendanceStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: AttendancePermissionService,
  ) {}

  /**
   * Get attendance statistics for an event
   */
  async getEventAttendanceStats(
    eventId: string,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    // Check permissions
    const hasPermission = await this.permissionService.checkPermission(
      eventId,
      currentUserId,
      userRole,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to view attendance statistics for this event',
      );
    }

    // Validate event exists
    await this.permissionService.validateEventAccess(eventId);

    // Get attendance stats
    const statusCounts = await this.prisma.eventAttendance.groupBy({
      by: ['status'],
      where: { eventId },
      _count: {
        status: true,
      },
    });

    // Transform the result into a more usable format
    const stats = this.transformStatsData(statusCounts);

    return stats;
  }

  /**
   * Get summary statistics for multiple events
   */
  async getMultipleEventsStats(eventIds: string[]) {
    const stats = await this.prisma.eventAttendance.groupBy({
      by: ['eventId', 'status'],
      where: {
        eventId: { in: eventIds },
      },
      _count: {
        status: true,
      },
    });

    // Group by event ID
    const eventStats: Record<string, any> = {};

    stats.forEach((stat) => {
      const eventId = stat.eventId;
      if (!eventStats[eventId]) {
        eventStats[eventId] = {
          total: 0,
          joined: 0,
          leftEarly: 0,
          noShow: 0,
        };
      }

      const count = stat._count.status;
      eventStats[eventId].total += count;

      switch (stat.status) {
        case AttendanceStatus.JOINED:
          eventStats[eventId].joined = count;
          break;
        case AttendanceStatus.LEFT_EARLY:
          eventStats[eventId].leftEarly = count;
          break;
        case AttendanceStatus.NO_SHOW:
          eventStats[eventId].noShow = count;
          break;
      }
    });

    return eventStats;
  }

  /**
   * Get user's attendance history statistics
   */
  async getUserAttendanceStats(userId: string) {
    const stats = await this.prisma.eventAttendance.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        status: true,
      },
    });

    return this.transformStatsData(stats);
  }

  /**
   * Transform raw statistics data into usable format
   */
  private transformStatsData(statusCounts: any[]) {
    const stats = {
      total: 0,
      joined: 0,
      leftEarly: 0,
      noShow: 0,
    };

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
}
