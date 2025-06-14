import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventStatus, SystemRole } from '@prisma/client';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto, userId: string) {
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

  async findAll(query: any = {}) {
    const {
      status,
      categoryId,
      search,
      skip = 0,
      take = 10,
      orderBy = 'dateTime',
      orderDir = 'desc',
    } = query;

    const where: any = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const events = await this.prisma.event.findMany({
      where,
      skip: Number(skip),
      take: Number(take),
      orderBy: {
        [orderBy]: orderDir,
      },
      include: {
        category: true,
        organizer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            interestedUsers: true,
            attendingUsers: true,
            volunteers: true,
          },
        },
      },
    });

    const total = await this.prisma.event.count({ where });

    return {
      data: events,
      meta: {
        total,
        skip: Number(skip),
        take: Number(take),
        hasMore: Number(skip) + Number(take) < total,
      },
    };
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

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    userId: string,
    userRole: SystemRole,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Authorization check - FIXED LOGIC
    if (userRole === SystemRole.SUPER_ADMIN) {
      // Super admin can update any event
    } else if (userRole === SystemRole.ADMIN) {
      // Admin can ONLY update events THEY organized
      if (event.organizerId !== userId) {
        throw new ForbiddenException(
          'You can only update events that you organize',
        );
      }
    } else {
      // Regular users cannot update events
      throw new ForbiddenException(
        'You do not have permission to update events',
      );
    }

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

  async remove(id: string, userId: string, userRole: SystemRole) {
    const event = await this.prisma.event.findUnique({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Authorization check - FIXED LOGIC
    if (userRole === SystemRole.SUPER_ADMIN) {
      // Super admin can delete any event
    } else if (userRole === SystemRole.ADMIN) {
      // Admin can ONLY delete events THEY organized
      if (event.organizerId !== userId) {
        throw new ForbiddenException(
          'You can only delete events that you organize',
        );
      }
    } else {
      // Regular users cannot delete events
      throw new ForbiddenException(
        'You do not have permission to delete events',
      );
    }

    // Soft delete
    return this.prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: EventStatus.CANCELLED,
      },
    });
  }

  async updateStatus(
    id: string,
    status: EventStatus,
    userId: string,
    userRole: SystemRole,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Authorization check - FIXED LOGIC
    if (userRole === SystemRole.SUPER_ADMIN) {
      // Super admin can update any event status
    } else if (userRole === SystemRole.ADMIN) {
      // Admin can ONLY update status for events THEY organized
      if (event.organizerId !== userId) {
        throw new ForbiddenException(
          'You can only update status for events that you organize',
        );
      }
    } else {
      // Regular users cannot update event status
      throw new ForbiddenException(
        'You do not have permission to update event status',
      );
    }

    return this.prisma.event.update({
      where: { id },
      data: { status },
      include: {
        category: true,
      },
    });
  }

  async getEventsByOrganizer(organizerId: string) {
    return this.prisma.event.findMany({
      where: {
        organizerId,
        deletedAt: null,
      },
      include: {
        category: true,
        _count: {
          select: {
            interestedUsers: true,
            attendingUsers: true,
            volunteers: true,
          },
        },
      },
      orderBy: {
        dateTime: 'desc',
      },
    });
  }

  async toggleVolunteerApplications(
    id: string,
    acceptingVolunteers: boolean,
    userId: string,
    userRole: SystemRole,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Authorization check - FIXED LOGIC
    if (userRole === SystemRole.SUPER_ADMIN) {
      // Super admin can update any event
    } else if (userRole === SystemRole.ADMIN) {
      // Admin can ONLY update events THEY organized
      if (event.organizerId !== userId) {
        throw new ForbiddenException(
          'You can only update events that you organize',
        );
      }
    } else {
      // Regular users cannot update events
      throw new ForbiddenException(
        'You do not have permission to update events',
      );
    }

    return this.prisma.event.update({
      where: { id },
      data: { acceptingVolunteers },
    });
  }

  // Get all attendees for an event
  async getEventAttendees(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return this.prisma.eventAttendance.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            gender: true,
            age: true,
            org: true,
            currentRole: true,
          },
        },
      },
    });
  }

  // Get all volunteers for an event
  async getEventVolunteers(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return this.prisma.eventVolunteer.findMany({
      where: {
        eventId: id,
        status: 'APPROVED',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            gender: true,
            age: true,
            org: true,
            currentRole: true,
          },
        },
      },
    });
  }
}
