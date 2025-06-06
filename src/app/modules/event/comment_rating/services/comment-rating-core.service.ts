import { Injectable, ForbiddenException } from '@nestjs/common';
import { SystemRole, CommentStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { CreateCommentRatingDto } from '../dto/create-comment-rating.dto';
import { UpdateCommentRatingDto } from '../dto/update-comment-rating.dto';
import { CommentRatingPermissionService } from './comment-rating-permission.service';

@Injectable()
export class CommentRatingCoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: CommentRatingPermissionService,
  ) {}

  /**************************************
   * CREATE OPERATIONS
   **************************************/

  /**
   * Create a new comment and rating for an event
   */
  async create(createCommentRatingDto: CreateCommentRatingDto, userId: string) {
    const { eventId, commentText, rating } = createCommentRatingDto;

    // Validate event is completed
    await this.permissionService.validateEventCompleted(eventId);

    // Validate user attended the event
    await this.permissionService.validateUserAttendance(userId, eventId);

    // Validate user hasn't already commented
    await this.permissionService.validateUniqueComment(userId, eventId);

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

  /**************************************
   * UPDATE OPERATIONS
   **************************************/

  /**
   * Update a comment rating
   */
  async update(
    id: string,
    updateCommentRatingDto: UpdateCommentRatingDto,
    userId: string,
    userRole: SystemRole,
  ) {
    // Validate comment exists
    const commentRating =
      await this.permissionService.validateCommentExists(id);

    // Validate user permissions
    const permissions =
      await this.permissionService.validateCommentModificationPermission(
        commentRating,
        userId,
        userRole,
      );

    // Prepare update data based on user permissions
    const updateData = this.prepareUpdateData(
      updateCommentRatingDto,
      permissions,
    );

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

  /**************************************
   * DELETE OPERATIONS
   **************************************/

  /**
   * Soft delete a comment by changing its status to DELETED
   */
  async remove(id: string, userId: string, userRole: SystemRole) {
    // Validate comment exists
    const commentRating =
      await this.permissionService.validateCommentExists(id);

    // Validate user permissions
    await this.permissionService.validateCommentModificationPermission(
      commentRating,
      userId,
      userRole,
    );

    // Soft delete by changing status to DELETED
    return this.prisma.commentRating.update({
      where: { id },
      data: {
        status: CommentStatus.DELETED,
      },
    });
  }

  /**************************************
   * PRIVATE HELPER METHODS
   **************************************/

  /**
   * Prepare update data based on user permissions
   */
  private prepareUpdateData(
    updateCommentRatingDto: UpdateCommentRatingDto,
    permissions: any,
  ) {
    const { isEventOrganizer } = permissions;

    // Regular users can only update comment text and rating
    if (!isEventOrganizer) {
      const { commentText, rating } = updateCommentRatingDto;
      return {
        ...(commentText !== undefined && { commentText }),
        ...(rating !== undefined && { rating }),
      };
    }

    // Event organizers can update everything including status
    return updateCommentRatingDto;
  }
}
