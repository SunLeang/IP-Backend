import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, EventStatus, SystemRole } from '@prisma/client';
import { AttendanceUtilsService } from './attendance-utils.service';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { AttendancePermissionService } from '../attendance-permission.service';
import { UpdateAttendanceDto } from '../../dto/update-attendance.dto';

@Injectable()
export class AttendanceCheckInService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: AttendancePermissionService,
    private readonly utilsService: AttendanceUtilsService,
  ) {}

  /**
   * Update attendance status (check-in, check-out, etc.)
   */
  async updateStatus(
    id: string,
    updateAttendanceDto: UpdateAttendanceDto,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    // Parse the composite key
    const [userId, eventId] = this.utilsService.parseCompositeId(id);

    // Find attendance record first
    const attendance = await this.findAttendanceWithEvent(userId, eventId);

    // Check permissions
    const hasPermission = await this.permissionService.checkPermission(
      eventId,
      currentUserId,
      userRole,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to update this attendance record',
      );
    }

    // Validate check-in conditions
    this.validateCheckInConditions(updateAttendanceDto, attendance);

    // Prepare update data
    const updateData = this.prepareUpdateData(
      updateAttendanceDto,
      currentUserId,
      attendance,
    );

    return this.prisma.eventAttendance.update({
      where: {
        userId_eventId: { userId, eventId },
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            username: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Quick check-in for an attendee
   */
  async checkIn(
    userId: string,
    eventId: string,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    const updateDto: UpdateAttendanceDto = {
      status: AttendanceStatus.JOINED,
    };

    return this.updateStatus(
      `${userId}:${eventId}`,
      updateDto,
      currentUserId,
      userRole,
    );
  }

  /**
   * Mark attendee as left early
   */
  async markLeftEarly(
    userId: string,
    eventId: string,
    currentUserId: string,
    userRole: SystemRole,
    notes?: string,
  ) {
    const updateDto: UpdateAttendanceDto = {
      status: AttendanceStatus.LEFT_EARLY,
      notes,
    };

    return this.updateStatus(
      `${userId}:${eventId}`,
      updateDto,
      currentUserId,
      userRole,
    );
  }

  /**
   * Mark attendee as no-show
   */
  async markNoShow(
    userId: string,
    eventId: string,
    currentUserId: string,
    userRole: SystemRole,
    notes?: string,
  ) {
    const updateDto: UpdateAttendanceDto = {
      status: AttendanceStatus.NO_SHOW,
      notes,
    };

    return this.updateStatus(
      `${userId}:${eventId}`,
      updateDto,
      currentUserId,
      userRole,
    );
  }

  /**************************************
   * PRIVATE HELPER METHODS
   **************************************/

  private async findAttendanceWithEvent(userId: string, eventId: string) {
    const attendance = await this.prisma.eventAttendance.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            organizerId: true,
            status: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    return attendance;
  }

  private validateCheckInConditions(
    updateDto: UpdateAttendanceDto,
    attendance: any,
  ) {
    if (
      updateDto.status === AttendanceStatus.JOINED &&
      attendance.event.status !== EventStatus.PUBLISHED
    ) {
      throw new BadRequestException(
        'Cannot check in attendees for events that are not currently active',
      );
    }
  }

  private prepareUpdateData(
    updateDto: UpdateAttendanceDto,
    currentUserId: string,
    attendance: any,
  ) {
    const updateData: any = {
      ...updateDto,
      updatedBy: currentUserId,
    };

    // Set check-in time if checking in for the first time
    if (
      updateDto.status === AttendanceStatus.JOINED &&
      !updateDto.checkedInAt &&
      !attendance.checkedInAt
    ) {
      updateData.checkedInAt = new Date();
    }

    // Set check-out time if leaving
    if (
      updateDto.status === AttendanceStatus.LEFT_EARLY &&
      !updateDto.checkedOutAt &&
      !attendance.checkedOutAt
    ) {
      updateData.checkedOutAt = new Date();
    }

    return updateData;
  }
}
