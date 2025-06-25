import { Injectable } from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { CreateAttendanceDto } from '../dto/create-attendance.dto';
import { UpdateAttendanceDto } from '../dto/update-attendance.dto';
import { AttendanceQueryDto } from '../dto/attendance-query.dto';
import { AttendanceCoreService } from './core-services/attendance-core.service';
import { AttendanceQueryService } from '../services/attendance-query.service';
import { AttendanceStatsService } from '../services/attendance-stats.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly coreService: AttendanceCoreService,
    private readonly queryService: AttendanceQueryService,
    private readonly statsService: AttendanceStatsService,
  ) {}

  /**************************************
   * CORE OPERATIONS (DELEGATED)
   **************************************/

  async register(
    createAttendanceDto: CreateAttendanceDto,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    return this.coreService.register(
      createAttendanceDto,
      currentUserId,
      userRole,
    );
  }

  async update(
    id: string,
    updateAttendanceDto: UpdateAttendanceDto,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    return this.coreService.update(
      id,
      updateAttendanceDto,
      currentUserId,
      userRole,
    );
  }

  async remove(id: string, currentUserId: string, userRole: SystemRole) {
    return this.coreService.remove(id, currentUserId, userRole);
  }

  async bulkCheckIn(
    eventId: string,
    userIds: string[],
    currentUserId: string,
    userRole: SystemRole,
  ) {
    return this.coreService.bulkCheckIn(
      eventId,
      userIds,
      currentUserId,
      userRole,
    );
  }

  /**************************************
   * QUERY OPERATIONS (DELEGATED)
   **************************************/

  async findAllByEvent(
    eventId: string,
    query: AttendanceQueryDto,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    return this.queryService.findAllByEvent(
      eventId,
      query,
      currentUserId,
      userRole,
    );
  }

  async findOne(id: string, currentUserId: string, userRole: SystemRole) {
    return this.queryService.findOne(id, currentUserId, userRole);
  }

  /**
   * ✅ FIXED: Check user attendance status - no permission restrictions for self-checks
   */
  async checkAttendanceStatus(userId: string, eventId: string) {
    console.log(
      `📋 Service: Checking attendance for user ${userId} on event ${eventId}`,
    );

    // ✅ IMPORTANT: This is always a self-check, so no additional permission validation needed
    // The query service will handle event existence validation
    return this.queryService.checkUserAttendanceStatus(userId, eventId);
  }

  /**************************************
   * STATISTICS OPERATIONS (DELEGATED)
   **************************************/

  async getEventAttendanceStats(
    eventId: string,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    return this.statsService.getEventAttendanceStats(
      eventId,
      currentUserId,
      userRole,
    );
  }

  async getUserAttendanceStats(userId: string) {
    return this.statsService.getUserAttendanceStats(userId);
  }

  async getMultipleEventsStats(eventIds: string[]) {
    return this.statsService.getMultipleEventsStats(eventIds);
  }
}
