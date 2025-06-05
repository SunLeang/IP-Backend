import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

// Import all specialized services
import { AttendanceService } from './services/attandance.service';
import { AttendancePermissionService } from './services/attendance-permission.service';
import { AttendanceQueryService } from './services/attendance-query.service';
import { AttendanceStatsService } from './services/attendance-stats.service';
import { AttendanceCoreService } from './services/core-services/attendance-core.service';
import { AttendanceRegistrationService } from './services/core-services/attendance-registration.service';
import { AttendanceCheckInService } from './services/core-services/attendance-checkin.service';
import { AttendanceBulkService } from './services/core-services/attendance-bulk.service';
import { AttendanceUtilsService } from './services/core-services/attendance-utils.service';


@Module({
  imports: [PrismaModule],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceCoreService,
    AttendancePermissionService,
    AttendanceQueryService,
    AttendanceStatsService,
    AttendanceRegistrationService,
    AttendanceCheckInService,
    AttendanceBulkService,
    AttendanceUtilsService,
  ],
  exports: [
    AttendanceService,
    AttendanceCoreService,
    AttendancePermissionService,
    AttendanceQueryService,
    AttendanceStatsService,
    AttendanceRegistrationService,
    AttendanceCheckInService,
    AttendanceBulkService,
    AttendanceUtilsService,
  ],
})
export class AttendanceModule {}
