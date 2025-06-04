import { Injectable, BadRequestException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';

@Injectable()
export class EventStatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**************************************
   * SYSTEM-WIDE STATISTICS
   **************************************/

  async getTotalSystemStats() {
    try {
      const [
        totalEvents,
        publishedEvents,
        draftEvents,
        completedEvents,
        cancelledEvents,
        totalAttendees,
        totalVolunteers,
      ] = await Promise.all([
        this.prisma.event.count({ where: { deletedAt: null } }),
        this.prisma.event.count({
          where: { deletedAt: null, status: EventStatus.PUBLISHED },
        }),
        this.prisma.event.count({
          where: { deletedAt: null, status: EventStatus.DRAFT },
        }),
        this.prisma.event.count({
          where: { deletedAt: null, status: EventStatus.COMPLETED },
        }),
        this.prisma.event.count({
          where: { deletedAt: null, status: EventStatus.CANCELLED },
        }),
        this.prisma.eventAttendance.count(),
        this.prisma.eventVolunteer.count({ where: { status: 'APPROVED' } }),
      ]);

      return {
        totalEvents,
        publishedEvents,
        draftEvents,
        completedEvents,
        cancelledEvents,
        totalAttendees,
        totalVolunteers,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve system statistics');
    }
  }

  /**************************************
   * ORGANIZER-SPECIFIC STATISTICS
   **************************************/

  async getOrganizerStats(organizerId: string) {
    this.validateOrganizerId(organizerId);

    try {
      const [
        totalEvents,
        publishedEvents,
        draftEvents,
        completedEvents,
        cancelledEvents,
        totalAttendees,
        totalVolunteers,
      ] = await Promise.all([
        this.prisma.event.count({ where: { organizerId, deletedAt: null } }),
        this.prisma.event.count({
          where: {
            organizerId,
            deletedAt: null,
            status: EventStatus.PUBLISHED,
          },
        }),
        this.prisma.event.count({
          where: { organizerId, deletedAt: null, status: EventStatus.DRAFT },
        }),
        this.prisma.event.count({
          where: {
            organizerId,
            deletedAt: null,
            status: EventStatus.COMPLETED,
          },
        }),
        this.prisma.event.count({
          where: {
            organizerId,
            deletedAt: null,
            status: EventStatus.CANCELLED,
          },
        }),
        this.prisma.eventAttendance.count({
          where: {
            event: { organizerId, deletedAt: null },
          },
        }),
        this.prisma.eventVolunteer.count({
          where: {
            status: 'APPROVED',
            event: { organizerId, deletedAt: null },
          },
        }),
      ]);

      return {
        totalEvents,
        publishedEvents,
        draftEvents,
        completedEvents,
        cancelledEvents,
        totalAttendees,
        totalVolunteers,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve organizer statistics for ${organizerId}`,
      );
    }
  }

  /**************************************
   * SUPPORTING DATA
   **************************************/

  async getRecentEvents(limit: number = 10) {
    try {
      return this.prisma.event.findMany({
        where: { deletedAt: null },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          organizer: {
            select: { id: true, fullName: true, email: true },
          },
          _count: {
            select: {
              interestedUsers: true,
              attendingUsers: true,
              volunteers: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException('Failed to retrieve recent events');
    }
  }

  async getEventCategories() {
    try {
      return this.prisma.eventCategory.findMany({
        include: {
          _count: {
            select: {
              events: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException('Failed to retrieve event categories');
    }
  }

  async getTotalEventsCount() {
    try {
      return this.prisma.event.count({
        where: { deletedAt: null },
      });
    } catch (error) {
      throw new BadRequestException('Failed to retrieve total events count');
    }
  }

  /**************************************
   * VALIDATION HELPER
   **************************************/

  private validateOrganizerId(organizerId: string): void {
    if (!organizerId || organizerId.trim() === '') {
      throw new BadRequestException('Organizer ID is required');
    }
  }
}
