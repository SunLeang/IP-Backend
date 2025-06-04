/**************************************
 * IMPORTS
 **************************************/
import {
  Controller,
  Get,
  UseGuards,
  Query,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/core/guards/roles.guard';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { GetUser } from 'src/app/core/decorators/get-user.decorator';
import { SystemRole, EventStatus } from '@prisma/client'; // Import EventStatus

// Import services
import { EventAnalyticsService } from './services/dashboard/event-analytics.service';

// Import Swagger decorators
import {
  EventDashboardControllerSwagger,
  AdminDashboardSwagger,
  GetUpcomingEventsPaginatedSwagger,
  GetCompletedEventsPaginatedSwagger,
  GetDraftEventsPaginatedSwagger,
  GetCancelledEventsPaginatedSwagger,
  GetDashboardStatsSwagger,
  GetEventsByOrganizerDashboardSwagger,
} from './decorators/swagger';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/
@EventDashboardControllerSwagger()
@Controller('events/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventDashboardController {
  constructor(private readonly eventAnalyticsService: EventAnalyticsService) {}

  /**************************************
   * HELPER METHODS
   **************************************/

  private validateUserId(
    userId: string | undefined,
    userRole: SystemRole,
  ): string {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return userId;
  }

  private validatePaginationLimit(limit: number): number {
    if (limit <= 0) {
      throw new BadRequestException('Limit must be greater than 0');
    }
    if (limit > 100) {
      throw new BadRequestException(
        'Limit cannot exceed 100 for performance reasons',
      );
    }
    return limit;
  }

  private validatePaginationPage(page: number): number {
    if (page <= 0) {
      throw new BadRequestException('Page must be greater than 0');
    }
    return page;
  }

  /**************************************
   * MAIN DASHBOARD ENDPOINT
   **************************************/

  @AdminDashboardSwagger()
  @Get()
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  getAdminDashboard(
    @GetUser('systemRole') userRole: SystemRole,
    @GetUser('id') userId: string, // Make required since we validate it anyway
  ) {
    // Validate userId for ADMIN role (SUPER_ADMIN might not need it in some cases)
    const validatedUserId = this.validateUserId(userId, userRole);
    return this.eventAnalyticsService.getAdminDashboard(
      userRole,
      validatedUserId,
    );
  }

  /**************************************
   * DASHBOARD STATISTICS ONLY
   **************************************/

  @GetDashboardStatsSwagger()
  @Get('stats')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  async getDashboardStats(
    @GetUser('systemRole') userRole: SystemRole,
    @GetUser('id') userId: string,
  ) {
    const validatedUserId = this.validateUserId(userId, userRole);
    const dashboardData = await this.eventAnalyticsService.getAdminDashboard(
      userRole,
      validatedUserId,
    );

    // Return only the overview statistics
    return {
      role: dashboardData.role,
      ...dashboardData.overview,
    };
  }

  /**************************************
   * PAGINATED EVENT ENDPOINTS FOR DASHBOARD
   **************************************/

  @GetUpcomingEventsPaginatedSwagger()
  @Get('upcoming')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  getUpcomingEventsPaginated(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @GetUser('systemRole') userRole: SystemRole,
    @GetUser('id') userId: string,
  ) {
    // Validate inputs
    const validatedPage = this.validatePaginationPage(page);
    const validatedLimit = this.validatePaginationLimit(limit);
    const validatedUserId = this.validateUserId(userId, userRole);

    if (userRole === SystemRole.SUPER_ADMIN) {
      return this.eventAnalyticsService.getSuperAdminEventsPaginated(
        EventStatus.PUBLISHED, // ✅ Use enum instead of string
        validatedPage,
        validatedLimit,
        { gte: new Date() },
      );
    } else {
      return this.eventAnalyticsService.getAdminEventsPaginated(
        validatedUserId,
        EventStatus.PUBLISHED, // ✅ Use enum instead of string
        validatedPage,
        validatedLimit,
        { gte: new Date() },
      );
    }
  }

  @GetCompletedEventsPaginatedSwagger()
  @Get('completed')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  getCompletedEventsPaginated(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @GetUser('systemRole') userRole: SystemRole,
    @GetUser('id') userId: string,
  ) {
    const validatedPage = this.validatePaginationPage(page);
    const validatedLimit = this.validatePaginationLimit(limit);
    const validatedUserId = this.validateUserId(userId, userRole);

    if (userRole === SystemRole.SUPER_ADMIN) {
      return this.eventAnalyticsService.getSuperAdminEventsPaginated(
        EventStatus.COMPLETED, // ✅ Use enum instead of string
        validatedPage,
        validatedLimit,
      );
    } else {
      return this.eventAnalyticsService.getAdminEventsPaginated(
        validatedUserId,
        EventStatus.COMPLETED, // ✅ Use enum instead of string
        validatedPage,
        validatedLimit,
      );
    }
  }

  @GetDraftEventsPaginatedSwagger()
  @Get('drafts')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  getDraftEventsPaginated(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @GetUser('systemRole') userRole: SystemRole,
    @GetUser('id') userId: string,
  ) {
    const validatedPage = this.validatePaginationPage(page);
    const validatedLimit = this.validatePaginationLimit(limit);
    const validatedUserId = this.validateUserId(userId, userRole);

    if (userRole === SystemRole.SUPER_ADMIN) {
      return this.eventAnalyticsService.getSuperAdminEventsPaginated(
        EventStatus.DRAFT, // ✅ Use enum instead of string
        validatedPage,
        validatedLimit,
      );
    } else {
      return this.eventAnalyticsService.getAdminEventsPaginated(
        validatedUserId,
        EventStatus.DRAFT, // ✅ Use enum instead of string
        validatedPage,
        validatedLimit,
      );
    }
  }

  @GetCancelledEventsPaginatedSwagger()
  @Get('cancelled')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  getCancelledEventsPaginated(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @GetUser('systemRole') userRole: SystemRole,
    @GetUser('id') userId: string,
  ) {
    const validatedPage = this.validatePaginationPage(page);
    const validatedLimit = this.validatePaginationLimit(limit);
    const validatedUserId = this.validateUserId(userId, userRole);

    if (userRole === SystemRole.SUPER_ADMIN) {
      return this.eventAnalyticsService.getSuperAdminEventsPaginated(
        EventStatus.CANCELLED, // ✅ Use enum instead of string
        validatedPage,
        validatedLimit,
      );
    } else {
      return this.eventAnalyticsService.getAdminEventsPaginated(
        validatedUserId,
        EventStatus.CANCELLED, // ✅ Use enum instead of string
        validatedPage,
        validatedLimit,
      );
    }
  }

  /**************************************
   * ORGANIZER-SPECIFIC ENDPOINTS
   **************************************/

  @GetEventsByOrganizerDashboardSwagger()
  @Get('organizer/:organizerId')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  getEventsByOrganizer(@Param('organizerId') organizerId: string) {
    if (!organizerId || organizerId.trim() === '') {
      throw new BadRequestException('Organizer ID is required');
    }
    return this.eventAnalyticsService.getEventsByOrganizer(organizerId);
  }
}
