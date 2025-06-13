import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/services/prisma.service';

@Injectable()
export class EventQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**************************************
   * COMPLEX QUERY METHODS
   **************************************/

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

    const where = this.buildWhereClause({ status, categoryId, search });
    const orderByClause = { [orderBy]: orderDir };

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip: Number(skip),
        take: Number(take),
        orderBy: orderByClause,
        include: this.getEventIncludeClause(),
      }),
      this.prisma.event.count({ where }),
    ]);

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

  async getEventAttendees(
    eventId: string,
    query?: { skip?: number; take?: number; search?: string; status?: any },
  ) {
    const { skip = 0, take = 100, search, status } = query || {};

    // Build where clause
    const where: any = { eventId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Get attendees with pagination
    const [attendees, total] = await Promise.all([
      this.prisma.eventAttendance.findMany({
        where,
        skip: Number(skip),
        take: Number(take),
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              username: true,
              gender: true,
              age: true,
              org: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.eventAttendance.count({ where }),
    ]);

    return {
      data: attendees,
      meta: {
        total,
        skip: Number(skip),
        take: Number(take),
        hasMore: Number(skip) + Number(take) < total,
      },
    };
  }

  async getEventVolunteers(eventId: string) {
    return this.prisma.eventVolunteer.findMany({
      where: {
        eventId,
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

  /**************************************
   * HELPER METHODS
   **************************************/

  private buildWhereClause({ status, categoryId, search }: any) {
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

    return where;
  }

  private getEventIncludeClause() {
    return {
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
    };
  }
}
