import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { CreateInterestDto } from './dto/create-interest.dto';
import { InterestQueryDto } from './dto/interest-query.dto';
import { SystemRole } from '@prisma/client';

@Injectable()
export class InterestService {
  constructor(private readonly prisma: PrismaService) {}

  /**************************************
   * CREATE OPERATIONS
   **************************************/

  /**
   * Add an event to user's interests
   */
  async addInterest(userId: string, createInterestDto: CreateInterestDto) {
    const { eventId } = createInterestDto;

    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check if already interested
    const existingInterest = await this.prisma.eventInterest.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existingInterest) {
      throw new ConflictException('You are already interested in this event');
    }

    // Create interest record
    return this.prisma.eventInterest.create({
      data: {
        user: { connect: { id: userId } },
        event: { connect: { id: eventId } },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            dateTime: true,
            profileImage: true,
            status: true,
          },
        },
      },
    });
  }

  /**************************************
   * READ OPERATIONS
   **************************************/

  /**
   * Get all interests for a user
   */
  async getUserInterests(userId: string, query: InterestQueryDto) {
    const { skip = 0, take = 10 } = query;

    // Get interests with pagination
    const [interests, total] = await Promise.all([
      this.prisma.eventInterest.findMany({
        where: { userId },
        skip: Number(skip),
        take: Number(take),
        include: {
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              dateTime: true,
              profileImage: true,
              coverImage: true,
              locationDesc: true,
              status: true,
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
                },
              },
            },
          },
        },
        orderBy: { interestedAt: 'desc' },
      }),
      this.prisma.eventInterest.count({ where: { userId } }),
    ]);

    // Return interests with pagination metadata
    return {
      data: interests,
      meta: {
        total,
        skip: Number(skip),
        take: Number(take),
        hasMore: Number(skip) + Number(take) < total,
      },
    };
  }

  /**
   * Get all interested users for an event (for admins or event organizers)
   */
  async getEventInterestedUsers(
    eventId: string,
    currentUserId: string,
    userRole: SystemRole,
    query: InterestQueryDto,
  ) {
    const { skip = 0, take = 10, search } = query;

    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: { organizerId: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check authorization - admins or event organizer only
    const isAdmin =
      userRole === SystemRole.SUPER_ADMIN || userRole === SystemRole.ADMIN;
    const isOrganizer = event.organizerId === currentUserId;

    if (!isAdmin && !isOrganizer) {
      throw new ForbiddenException(
        'Only the event organizer or administrators can view interested users',
      );
    }

    // Build where clause for search functionality
    const where: any = { eventId };

    if (search) {
      where.user = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Get interests with pagination
    const [interests, total] = await Promise.all([
      this.prisma.eventInterest.findMany({
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
              currentRole: true,
            },
          },
        },
        orderBy: { interestedAt: 'desc' },
      }),
      this.prisma.eventInterest.count({ where }),
    ]);

    // Return interests with pagination metadata
    return {
      data: interests,
      meta: {
        total,
        skip: Number(skip),
        take: Number(take),
        hasMore: Number(skip) + Number(take) < total,
      },
    };
  }

  /**
   * Check if a user is interested in an event
   */
  async checkUserInterest(userId: string, eventId: string) {
    const interest = await this.prisma.eventInterest.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    return { interested: !!interest };
  }

  /**************************************
   * DELETE OPERATIONS
   **************************************/

  /**
   * Remove event from user's interests
   */
  async removeInterest(userId: string, eventId: string) {
    // Check if interest exists
    const interest = await this.prisma.eventInterest.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (!interest) {
      throw new NotFoundException('Interest record not found');
    }

    // Delete the interest
    return this.prisma.eventInterest.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });
  }
}
