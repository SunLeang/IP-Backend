import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { Event, Prisma, EventStatus } from '@prisma/client';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: { deletedAt: null },
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

  async findOne(id: string): Promise<Event> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        category: true,
        organizer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        volunteers: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        attendingUsers: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!event || event.deletedAt) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async create(organizerId: string, data: CreateEventDto): Promise<Event> {
    const { categoryId, ...eventData } = data;
    return this.prisma.event.create({
      data: {
        ...eventData,
        organizer: {
          connect: { id: organizerId },
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

  async update(id: string, data: UpdateEventDto): Promise<Event> {
    await this.findOne(id); // Check if event exists

    return this.prisma.event.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
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

  async softDelete(id: string): Promise<Event> {
    await this.findOne(id); // Check if event exists

    return this.prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async updateStatus(id: string, status: EventStatus): Promise<Event> {
    await this.findOne(id); // Check if event exists

    return this.prisma.event.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  async findByOrganizer(organizerId: string): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: {
        organizerId,
        deletedAt: null,
      },
      include: {
        category: true,
      },
    });
  }

  async findUpcoming(): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: {
        dateTime: {
          gte: new Date(),
        },
        status: EventStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        category: true,
        organizer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        dateTime: 'asc',
      },
    });
  }
}
