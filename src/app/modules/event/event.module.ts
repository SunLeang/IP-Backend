import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { CategoryModule } from './category/category.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AttendanceService } from './attendance/attendance.service';
import { AttendanceController } from './attendance/attendance.controller';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [PrismaModule, CategoryModule, AttendanceModule],
  controllers: [EventController, AttendanceController],
  providers: [EventService, AttendanceService],
  exports: [EventService],
})
export class EventModule {}