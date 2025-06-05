import { Module } from '@nestjs/common';

// Import controllers
import { EventController } from './event.controller';
import { EventDashboardController } from './event-dashboard.controller';
import { AttendanceController } from './attendance/attendance.controller';

// Import services
import { EventService } from './services/event.service';
import { EventPermissionService } from './services/event-permission.service';
import { EventQueryService } from './services/event-query.service';
import { EventAdminService } from './services/event-admin.service';
import { EventAnalyticsService } from './services/dashboard/event-analytics.service';
import { EventDashboardService } from './services/dashboard/event-dashboard.service';
import { EventStatsService } from './services/dashboard/event-stats.service';
import { EventPaginationService } from './services/dashboard/event-pagination.service';
import { AttendanceService } from './attendance/services/attandance.service';
import { InterestService } from './interest/interest.service';

// Import modules
import { PrismaModule } from '../../prisma/prisma.module';
import { CategoryModule } from './category/category.module';
import { AttendanceModule } from './attendance/attendance.module';
import { InterestModule } from './interest/interest.module';
import { CommentRatingModule } from './comment_rating/comment-rating.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { TaskModule } from './task/task.module';


@Module({
  imports: [
    PrismaModule,
    CategoryModule,
    AttendanceModule,
    InterestModule,
    CommentRatingModule,
    AnnouncementModule,
    TaskModule,
  ],
  controllers: [
    EventController,
    EventDashboardController,
    AttendanceController,
  ],
  providers: [
    EventService,
    EventPermissionService,
    EventQueryService,
    EventAdminService,
    EventAnalyticsService,
    EventDashboardService,
    EventStatsService,
    EventPaginationService,
    AttendanceService,
    InterestService,
  ],
  exports: [
    EventService,
    EventPermissionService,
    EventQueryService,
    EventAdminService,
    EventAnalyticsService,
    EventDashboardService,
    EventStatsService,
    EventPaginationService,
  ],
})
export class EventModule {}
