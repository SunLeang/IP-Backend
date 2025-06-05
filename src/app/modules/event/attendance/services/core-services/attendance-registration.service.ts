import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AttendanceStatus, EventStatus, SystemRole } from '@prisma/client';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { AttendancePermissionService } from '../attendance-permission.service';
import { CreateAttendanceDto } from '../../dto/create-attendance.dto';

@Injectable()
export class AttendanceRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: AttendancePermissionService,
  ) {}

  /**
   * Register a new attendee for an event
   */
  async register(
    createAttendanceDto: CreateAttendanceDto,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    const {
      eventId,
      userId,
      status = AttendanceStatus.JOINED,
      notes,
    } = createAttendanceDto;

    // Check permissions
    const hasPermission = await this.permissionService.checkPermission(
      eventId,
      currentUserId,
      userRole,
      userId,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to register attendees for this event',
      );
    }

    // Validate event and user exist
    const event = await this.permissionService.validateEventAccess(eventId);
    await this.permissionService.validateUserExists(userId);

    // Check if event is not completed
    if (event.status === EventStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot register attendees for a completed event',
      );
    }

    // Check if attendance record already exists
    const existingAttendance = await this.findExistingAttendance(
      userId,
      eventId,
    );

    if (existingAttendance) {
      // Update existing attendance instead
      return this.updateExistingAttendance(userId, eventId, status);
    }

    // Create new attendance record
    return this.createNewAttendance(userId, eventId, status, notes);
  }

  /**
   * Unregister an attendee from an event
   */
  async unregister(
    userId: string,
    eventId: string,
    currentUserId: string,
    userRole: SystemRole,
  ) {
    // Check permissions
    const hasPermission = await this.permissionService.checkPermission(
      eventId,
      currentUserId,
      userRole,
      userId,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to unregister attendees for this event',
      );
    }

    // Validate attendance exists
    const attendance = await this.findExistingAttendance(userId, eventId);
    if (!attendance) {
      throw new BadRequestException('Attendance record not found');
    }

    // Remove attendance record
    return this.prisma.eventAttendance.delete({
      where: {
        userId_eventId: { userId, eventId },
      },
    });
  }

  /**************************************
   * PRIVATE HELPER METHODS
   **************************************/

  private async findExistingAttendance(userId: string, eventId: string) {
    return this.prisma.eventAttendance.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });
  }

  private async updateExistingAttendance(
    userId: string,
    eventId: string,
    status: AttendanceStatus,
  ) {
    return this.prisma.eventAttendance.update({
      where: {
        userId_eventId: { userId, eventId },
      },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }

  private async createNewAttendance(
    userId: string,
    eventId: string,
    status: AttendanceStatus,
    notes?: string,
  ) {
    return this.prisma.eventAttendance.create({
      data: {
        user: { connect: { id: userId } },
        event: { connect: { id: eventId } },
        status,
        notes,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            username: true,
          },
        },
      },
    });
  }
}
