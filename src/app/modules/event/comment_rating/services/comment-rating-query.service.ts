import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { CommentRatingPermissionService } from './comment-rating-permission.service';

@Injectable()
export class CommentRatingQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: CommentRatingPermissionService,
  ) {}

  /**************************************
   * EVENT COMMENTS QUERIES
   **************************************/

  /**
   * Get all comments and ratings for an event
   */
  async findAllForEvent(eventId: string) {
    // Validate event exists
    await this.permissionService.validateEventAccess(eventId);

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

  /**************************************
   * SINGLE COMMENT QUERIES
   **************************************/

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

  /**************************************
   * USER COMMENTS QUERIES
   **************************************/

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
}
