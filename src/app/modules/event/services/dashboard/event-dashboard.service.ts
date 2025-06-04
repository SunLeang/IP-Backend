import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventStatus, SystemRole } from '@prisma/client';
import { EventStatsService } from './event-stats.service';
import { EventPaginationService } from './event-pagination.service';

@Injectable()
export class EventDashboardService {
  constructor(
    private readonly eventStatsService: EventStatsService,
    private readonly eventPaginationService: EventPaginationService,
  ) {}

  /**************************************
   * MAIN DASHBOARD METHODS
   **************************************/

  async getAdminDashboard(userRole: SystemRole, userId: string) {
    // Validate inputs
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('User ID is required');
    }

    if (userRole === SystemRole.SUPER_ADMIN) {
      return this.getSuperAdminDashboard();
    } else if (userRole === SystemRole.ADMIN) {
      return this.getRegularAdminDashboard(userId);
    } else {
      throw new ForbiddenException('Unauthorized access to admin dashboard');
    }
  }

  /**************************************
   * SUPER ADMIN DASHBOARD
   **************************************/

  private async getSuperAdminDashboard() {
    const [
      upcomingEventsPage,
      pastEventsPage,
      draftEventsPage,
      cancelledEventsPage,
      categories,
      totalStats,
      recentEvents,
    ] = await Promise.all([
      // Get first 20 upcoming published events + total count
      this.eventPaginationService.getSuperAdminEventsPaginated(
        EventStatus.PUBLISHED,
        1,
        20,
        { gte: new Date() },
      ),
      // Get first 20 completed events + total count
      this.eventPaginationService.getSuperAdminEventsPaginated(
        EventStatus.COMPLETED,
        1,
        20,
      ),
      // Get first 20 draft events + total count
      this.eventPaginationService.getSuperAdminEventsPaginated(
        EventStatus.DRAFT,
        1,
        20,
      ),
      // Get first 20 cancelled events + total count
      this.eventPaginationService.getSuperAdminEventsPaginated(
        EventStatus.CANCELLED,
        1,
        20,
      ),
      this.eventStatsService.getEventCategories(),
      this.eventStatsService.getTotalSystemStats(),
      this.eventStatsService.getRecentEvents(10),
    ]);

    return {
      role: 'SUPER_ADMIN',
      overview: {
        totalEvents: totalStats.totalEvents,
        publishedEvents: totalStats.publishedEvents,
        draftEvents: totalStats.draftEvents,
        completedEvents: totalStats.completedEvents,
        cancelledEvents: totalStats.cancelledEvents,
        totalAttendees: totalStats.totalAttendees,
        totalVolunteers: totalStats.totalVolunteers,
      },
      upcomingEvents: {
        totalCount: totalStats.publishedEvents,
        currentPage: upcomingEventsPage.meta.page,
        totalPages: upcomingEventsPage.meta.totalPages,
        hasMore: upcomingEventsPage.meta.hasMore,
        events: upcomingEventsPage.data,
      },
      pastEvents: {
        totalCount: totalStats.completedEvents,
        currentPage: pastEventsPage.meta.page,
        totalPages: pastEventsPage.meta.totalPages,
        hasMore: pastEventsPage.meta.hasMore,
        events: pastEventsPage.data,
      },
      draftEvents: {
        totalCount: totalStats.draftEvents,
        currentPage: draftEventsPage.meta.page,
        totalPages: draftEventsPage.meta.totalPages,
        hasMore: draftEventsPage.meta.hasMore,
        events: draftEventsPage.data,
      },
      cancelledEvents: {
        totalCount: totalStats.cancelledEvents,
        currentPage: cancelledEventsPage.meta.page,
        totalPages: cancelledEventsPage.meta.totalPages,
        hasMore: cancelledEventsPage.meta.hasMore,
        events: cancelledEventsPage.data,
      },
      categories,
      recentActivity: recentEvents,
    };
  }

  /**************************************
   * REGULAR ADMIN DASHBOARD
   **************************************/

  private async getRegularAdminDashboard(organizerId: string) {
    this.validateOrganizerId(organizerId);

    const [
      myUpcomingEventsPage,
      myPastEventsPage,
      myDraftEventsPage,
      myCancelledEventsPage,
      myEventStats,
      categories,
    ] = await Promise.all([
      // Get first 20 of admin's upcoming events + total count
      this.eventPaginationService.getAdminEventsPaginated(
        organizerId,
        EventStatus.PUBLISHED,
        1,
        20,
        { gte: new Date() },
      ),
      // Get first 20 of admin's completed events + total count
      this.eventPaginationService.getAdminEventsPaginated(
        organizerId,
        EventStatus.COMPLETED,
        1,
        20,
      ),
      // Get first 20 of admin's draft events + total count
      this.eventPaginationService.getAdminEventsPaginated(
        organizerId,
        EventStatus.DRAFT,
        1,
        20,
      ),
      // Get first 20 of admin's cancelled events + total count
      this.eventPaginationService.getAdminEventsPaginated(
        organizerId,
        EventStatus.CANCELLED,
        1,
        20,
      ),
      this.eventStatsService.getOrganizerStats(organizerId),
      this.eventStatsService.getEventCategories(),
    ]);

    return {
      role: 'ADMIN',
      overview: {
        myTotalEvents: myEventStats.totalEvents,
        myPublishedEvents: myEventStats.publishedEvents,
        myDraftEvents: myEventStats.draftEvents,
        myCompletedEvents: myEventStats.completedEvents,
        myCancelledEvents: myEventStats.cancelledEvents,
        myTotalAttendees: myEventStats.totalAttendees,
        myTotalVolunteers: myEventStats.totalVolunteers,
      },
      myUpcomingEvents: {
        totalCount: myEventStats.publishedEvents,
        currentPage: myUpcomingEventsPage.meta.page,
        totalPages: myUpcomingEventsPage.meta.totalPages,
        hasMore: myUpcomingEventsPage.meta.hasMore,
        events: myUpcomingEventsPage.data,
      },
      myPastEvents: {
        totalCount: myEventStats.completedEvents,
        currentPage: myPastEventsPage.meta.page,
        totalPages: myPastEventsPage.meta.totalPages,
        hasMore: myPastEventsPage.meta.hasMore,
        events: myPastEventsPage.data,
      },
      myDraftEvents: {
        totalCount: myEventStats.draftEvents,
        currentPage: myDraftEventsPage.meta.page,
        totalPages: myDraftEventsPage.meta.totalPages,
        hasMore: myDraftEventsPage.meta.hasMore,
        events: myDraftEventsPage.data,
      },
      myCancelledEvents: {
        totalCount: myEventStats.cancelledEvents,
        currentPage: myCancelledEventsPage.meta.page,
        totalPages: myCancelledEventsPage.meta.totalPages,
        hasMore: myCancelledEventsPage.meta.hasMore,
        events: myCancelledEventsPage.data,
      },
      categories,
    };
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
