import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { CreateCommentRatingDto } from './dto/create-comment-rating.dto';
import { UpdateCommentRatingDto } from './dto/update-comment-rating.dto';
import {
  CommentStatus,
  EventStatus,
  AttendanceStatus,
  SystemRole,
} from '@prisma/client';

@Injectable()
export class CommentRatingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new comment and rating for an event
   */
  async create(createCommentRatingDto: CreateCommentRatingDto, userId: string) {
    const { eventId, commentText, rating } = createCommentRatingDto;

    // Check if event exists and is completed
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check if the event has ended
    if (event.status !== EventStatus.COMPLETED) {
      throw new ForbiddenException(
        'Comments and ratings can only be submitted for completed events',
      );
    }

    // Check if the user actually attended the event
    const attendance = await this.prisma.eventAttendance.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (!attendance) {
      throw new ForbiddenException(
        'Only attendees of the event can submit comments and ratings',
      );
    }

    // Check if user has already submitted a comment/rating for this event
    const existingComment = await this.prisma.commentRating.findFirst({
      where: {
        userId,
        eventId,
        status: CommentStatus.ACTIVE,
      },
    });

    if (existingComment) {
      throw new ConflictException(
        'You have already submitted a comment and rating for this event',
      );
    }

    // Create the comment and rating
    return this.prisma.commentRating.create({
      data: {
        commentText,
        rating,
        user: { connect: { id: userId } },
        event: { connect: { id: eventId } },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Get all comments and ratings for an event
   */
  async findAllForEvent(eventId: string) {
    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Get all active comments for the event
    return this.prisma.commentRating.findMany({
      where: {
        eventId,
        status: CommentStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get comments and ratings statistics for an event
   */
  async getEventRatingStats(eventId: string) {
    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Calculate average rating and count
    const aggregations = await this.prisma.commentRating.aggregate({
      where: {
        eventId,
        status: CommentStatus.ACTIVE,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
      _max: {
        rating: true,
      },
      _min: {
        rating: true,
      },
    });

    // Count ratings by score (1-5)
    const ratingCounts = await Promise.all(
      [1, 2, 3, 4, 5].map(async (rating) => {
        const count = await this.prisma.commentRating.count({
          where: {
            eventId,
            rating,
            status: CommentStatus.ACTIVE,
          },
        });
        return { rating, count };
      }),
    );

    return {
      averageRating: aggregations._avg.rating || 0,
      totalRatings: aggregations._count.rating || 0,
      highestRating: aggregations._max.rating || 0,
      lowestRating: aggregations._min.rating || 0,
      ratingDistribution: ratingCounts,
    };
  }

  /**
   * Find a specific comment rating by ID
   */
  async findOne(id: string) {
    const commentRating = await this.prisma.commentRating.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            dateTime: true,
          },
        },
      },
    });

    if (!commentRating) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return commentRating;
  }

  /**
   * Get all comments and ratings created by a user
   */
  async findAllByUser(userId: string) {
    return this.prisma.commentRating.findMany({
      where: {
        userId,
        status: CommentStatus.ACTIVE,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            dateTime: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update a comment rating
   */
  async update(
    id: string,
    updateCommentRatingDto: UpdateCommentRatingDto,
    userId: string,
    userRole: SystemRole,
  ) {
    const commentRating = await this.prisma.commentRating.findUnique({
      where: { id },
    });

    if (!commentRating) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Check if the user is the owner of the comment or an admin
    if (commentRating.userId !== userId && userRole === SystemRole.USER) {
      throw new ForbiddenException(
        'You can only update your own comments and ratings',
      );
    }

    // Regular users can only update comment text and rating
    let updateData = {};

    if (userRole === SystemRole.USER) {
      const { commentText, rating } = updateCommentRatingDto;
      updateData = {
        ...(commentText !== undefined && { commentText }),
        ...(rating !== undefined && { rating }),
      };
    } else {
      // Admins can update everything including status
      updateData = updateCommentRatingDto;
    }

    return this.prisma.commentRating.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
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
   * Soft delete a comment by changing its status to DELETED
   */
  async remove(id: string, userId: string, userRole: SystemRole) {
    const commentRating = await this.prisma.commentRating.findUnique({
      where: { id },
    });

    if (!commentRating) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Check if the user is the owner of the comment or an admin/super admin
    if (commentRating.userId !== userId && userRole === SystemRole.USER) {
      throw new ForbiddenException(
        'You can only delete your own comments and ratings',
      );
    }

    // Soft delete by changing status to DELETED
    return this.prisma.commentRating.update({
      where: { id },
      data: {
        status: CommentStatus.DELETED,
      },
    });
  }
}
