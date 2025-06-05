import { Injectable } from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { AttendanceRegistrationService } from './attendance-registration.service';
import { AttendanceCheckInService } from './attendance-checkin.service';
import { AttendanceBulkService } from './attendance-bulk.service';
import { AttendanceUtilsService } from './attendance-utils.service';
import { AttendancePermissionService } from '../attendance-permission.service';
import { CreateAttendanceDto } from '../../dto/create-attendance.dto';
import { UpdateAttendanceDto } from '../../dto/update-attendance.dto';

@Injectable()
export class AttendanceCoreService {
  constructor(
    private readonly registrationService: AttendanceRegistrationService,
    private readonly checkInService: AttendanceCheckInService,
    private readonly bulkService: AttendanceBulkService,
    private readonly permissionService: AttendancePermissionService,
    private readonly utilsService: AttendanceUtilsService,
  ) {}

  /**************************************
   * REGISTRATION OPERATIONS (DELEGATED)
   **************************************/

  async register(
    createAttendanceDto: CreateAttendanceDto,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    return this.registrationService.register(
      createAttendanceDto,
      currentUserId,
      userRole,
    );
  }

  /**************************************
   * CHECK-IN OPERATIONS (DELEGATED)
   **************************************/

  async update(
    id: string,
    updateAttendanceDto: UpdateAttendanceDto,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    return this.checkInService.updateStatus(
      id,
      updateAttendanceDto,
      currentUserId,
      userRole,
    );
  }

  async checkIn(
    userId: string,
    eventId: string,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    return this.checkInService.checkIn(
      userId,
      eventId,
      currentUserId,
      userRole,
    );
  }

  async markLeftEarly(
    userId: string,
    eventId: string,
    currentUserId: string,
    userRole: SystemRole,
    notes?: string,
  ) {
    return this.checkInService.markLeftEarly(
      userId,
      eventId,
      currentUserId,
      userRole,
      notes,
    );
  }

  async markNoShow(
    userId: string,
    eventId: string,
    currentUserId: string,
    userRole: SystemRole,
    notes?: string,
  ) {
    return this.checkInService.markNoShow(
      userId,
      eventId,
      currentUserId,
      userRole,
      notes,
    );
  }

  /**************************************
   * REMOVAL OPERATIONS
   **************************************/

  async remove(id: string, currentUserId: string, userRole: SystemRole) {
    const [userId, eventId] = this.utilsService.parseCompositeId(id);
    return this.registrationService.unregister(
      userId,
      eventId,
      currentUserId,
      userRole,
    );
  }

  /**************************************
   * BULK OPERATIONS (DELEGATED)
   **************************************/

  async bulkCheckIn(
    eventId: string,
    userIds: string[],
    currentUserId: string,
    userRole: SystemRole,
  ) {
    this.utilsService.validateUserIds(userIds);
    return this.bulkService.bulkCheckIn(
      eventId,
      userIds,
      currentUserId,
      userRole,
    );
  }

  async bulkRegister(
    eventId: string,
    userIds: string[],
    currentUserId: string,
    userRole: SystemRole,
  ) {
    this.utilsService.validateUserIds(userIds);
    return this.bulkService.bulkRegister(
      eventId,
      userIds,
      currentUserId,
      userRole,
    );
  }

  async bulkUpdateStatus(
    eventId: string,
    userIds: string[],
    status: any,
    currentUserId: string,
    userRole: SystemRole,
    notes?: string,
  ) {
    this.utilsService.validateUserIds(userIds);
    return this.bulkService.bulkUpdateStatus(
      eventId,
      userIds,
      status,
      currentUserId,
      userRole,
      notes,
    );
  }
}
