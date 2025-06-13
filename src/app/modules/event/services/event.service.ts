import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventStatus, SystemRole } from '@prisma/client';
import { EventQueryService } from './event-query.service';
import { EventPermissionService } from './event-permission.service';

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryService: EventQueryService,
    private readonly permissionService: EventPermissionService,
  ) {}

  /**************************************
   * CORE CRUD OPERATIONS
   **************************************/

  async create(
    createEventDto: CreateEventDto,
    userId: string,
    userRole?: SystemRole,
  ) {
    // Verify category exists
    const category = await this.prisma.eventCategory.findUnique({
      where: { id: createEventDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createEventDto.categoryId} not found`,
      );
    }

    // Create a new object without categoryId to avoid the duplication
    const { categoryId, ...eventData } = createEventDto;

    return this.prisma.event.create({
      data: {
        ...eventData,
        organizer: {
          connect: { id: userId },
        },
        category: {
          connect: { id: categoryId },
        },
      },
      include: {
        category: true,
        organizer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: true,
        organizer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            interestedUsers: true,
            attendingUsers: true,
            volunteers: true,
            tasks: true,
            announcements: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async updateBasic(id: string, updateEventDto: UpdateEventDto) {
    // If categoryId is being updated, check if it exists
    if (updateEventDto.categoryId) {
      const category = await this.prisma.eventCategory.findUnique({
        where: { id: updateEventDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateEventDto.categoryId} not found`,
        );
      }
    }

    return this.prisma.event.update({
      where: { id },
      data: updateEventDto,
      include: {
        category: true,
        organizer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: EventStatus) {
    return this.prisma.event.update({
      where: { id },
      data: { status },
      include: {
        category: true,
      },
    });
  }

  async toggleVolunteerAcceptance(id: string, acceptingVolunteers: boolean) {
    return this.prisma.event.update({
      where: { id },
      data: { acceptingVolunteers },
    });
  }

  async softDelete(id: string) {
    return this.prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: EventStatus.CANCELLED,
      },
    });
  }

  /**************************************
   * BASIC VALIDATION HELPERS
   **************************************/

  async findEventOrThrow(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  /**************************************
   * PERMISSION-AWARE DATA ACCESS METHODS
   **************************************/

  /**
   * Get attendees for an event with permission validation
   */
  async getEventAttendees(
    eventId: string,
    userId: string,
    userRole: SystemRole,
    query?: { skip?: number; take?: number; search?: string; status?: any },
  ) {
    // Validate permissions
    await this.permissionService.validateAttendeeViewPermission(
      eventId,
      userId,
      userRole,
    );

    return this.queryService.getEventAttendees(eventId, query);
  }

  /**
   * Get volunteers for an event with permission validation
   */
  async getEventVolunteers(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    // Validate permissions
    await this.permissionService.validateVolunteerViewPermission(
      eventId,
      userId,
      userRole,
    );

    return this.queryService.getEventVolunteers(eventId);
  }
}