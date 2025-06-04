import { Injectable } from '@nestjs/common';
import { Prisma, SystemRole } from '@prisma/client';
import { EventDashboardService } from './event-dashboard.service';
import { EventPaginationService } from './event-pagination.service';
import { EventQueryService } from '../event-query.service';

@Injectable()
export class EventAnalyticsService {
  constructor(
    private readonly eventDashboardService: EventDashboardService,
    private readonly eventPaginationService: EventPaginationService,
    private readonly eventQueryService: EventQueryService,
  ) {}

  /**************************************
   * DASHBOARD METHODS (DELEGATED)
   **************************************/

  async getAdminDashboard(userRole: SystemRole, userId: string) {
    return this.eventDashboardService.getAdminDashboard(userRole, userId);
  }

  /**************************************
   * PAGINATION METHODS (DELEGATED)
   **************************************/

  async getSuperAdminEventsPaginated(
    status: any,
    page: number = 1,
    limit: number = 20,
    dateFilter?: Prisma.EventWhereInput['dateTime'],
  ) {
    return this.eventPaginationService.getSuperAdminEventsPaginated(
      status,
      page,
      limit,
      dateFilter,
    );
  }

  async getAdminEventsPaginated(
    organizerId: string,
    status: any,
    page: number = 1,
    limit: number = 20,
    dateFilter?: Prisma.EventWhereInput['dateTime'],
  ) {
    return this.eventPaginationService.getAdminEventsPaginated(
      organizerId,
      status,
      page,
      limit,
      dateFilter,
    );
  }

  /**************************************
   * QUERY METHODS (DELEGATED)
   **************************************/

  async getEventsByOrganizer(organizerId: string) {
    return this.eventQueryService.getEventsByOrganizer(organizerId);
  }
}
