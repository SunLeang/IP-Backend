import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { CategoryModule } from './category/category.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AttendanceService } from './attendance/attendance.service';
import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceModule } from './attendance/attendance.module';
import { InterestService } from './interest/interest.service';
import { InterestModule } from './interest/interest.module';
import { CommentRatingModule } from './comment_rating/comment-rating.module';
import { AnnouncementModule } from './announcement/announcement.module';

@Module({
  imports: [
    PrismaModule,
    CategoryModule,
    AttendanceModule,
    InterestModule,
    CommentRatingModule,
    AnnouncementModule,
  ],
  controllers: [EventController, AttendanceController],
  providers: [EventService, AttendanceService, InterestService],
  exports: [EventService],
})
export class EventModule {}
