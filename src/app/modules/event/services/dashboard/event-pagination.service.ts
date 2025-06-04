import { Injectable, BadRequestException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { EventQueryService } from '../event-query.service';

@Injectable()
export class EventPaginationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventQueryService: EventQueryService,
  ) {}

  /**************************************
   * SUPER ADMIN PAGINATION (ALL EVENTS)
   **************************************/

  async getSuperAdminEventsPaginated(
    status: EventStatus,
    page: number = 1,
    limit: number = 20,
    dateFilter?: any, 
  ) {
    // Validate inputs
    this.validatePaginationParams(page, limit);
    this.validateEventStatus(status);

    const query: any = {
      status,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: status === EventStatus.PUBLISHED ? 'dateTime' : 'updatedAt',
      orderDir: 'desc',
    };

    if (dateFilter) {
      query.dateTime = dateFilter;
    }

    const result = await this.eventQueryService.findAll(query);

    // Ensure consistent meta format
    return {
      data: result.data,
      meta: {
        total: result.meta.total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(result.meta.total / limit),
        skip: result.meta.skip || (page - 1) * limit,
        take: result.meta.take || limit,
        hasMore: result.meta.hasMore || page * limit < result.meta.total,
      },
    };
  }

  /**************************************
   * ADMIN PAGINATION (ORGANIZER'S EVENTS)
   **************************************/

  async getAdminEventsPaginated(
    organizerId: string,
    status: EventStatus,
    page: number = 1,
    limit: number = 20,
    dateFilter?: any,
  ) {
    // Validate inputs
    this.validatePaginationParams(page, limit);
    this.validateEventStatus(status);
    this.validateOrganizerId(organizerId);

    const skip = (page - 1) * limit;
    const where: any = {
      organizerId,
      deletedAt: null,
      status,
    };

    if (dateFilter) {
      where.dateTime = dateFilter;
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: { dateTime: 'desc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: events,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        skip,
        take: limit,
        hasMore: page * limit < total,
      },
    };
  }

  /**************************************
   * VALIDATION METHODS
   **************************************/

  private validatePaginationParams(page: number, limit: number): void {
    if (page <= 0) {
      throw new BadRequestException('Page must be greater than 0');
    }
    if (limit <= 0) {
      throw new BadRequestException('Limit must be greater than 0');
    }
    if (limit > 100) {
      throw new BadRequestException(
        'Limit cannot exceed 100 for performance reasons',
      );
    }
  }

  private validateEventStatus(status: EventStatus): void {
    const validStatuses = Object.values(EventStatus);
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid event status: ${status}`);
    }
  }

  private validateOrganizerId(organizerId: string): void {
    if (!organizerId || organizerId.trim() === '') {
      throw new BadRequestException('Organizer ID is required');
    }
  }
}
