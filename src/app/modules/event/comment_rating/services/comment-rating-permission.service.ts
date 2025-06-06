import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SystemRole, EventStatus, CommentStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';

@Injectable()
export class CommentRatingPermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**************************************
   * EVENT VALIDATION
   **************************************/

  /**
   * Check if event exists and validate access
   */
  async validateEventAccess(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return event;
  }

  /**
   * Check if event is completed (required for comments)
   */
  async validateEventCompleted(eventId: string) {
    const event = await this.validateEventAccess(eventId);

    if (event.status !== EventStatus.COMPLETED) {
      throw new ForbiddenException(
        'Comments and ratings can only be submitted for completed events',
      );
    }

    return event;
  }

  /**************************************
   * ATTENDANCE VALIDATION
   **************************************/

  /**
   * Check if user attended the event
   */
  async validateUserAttendance(userId: string, eventId: string) {
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

    return attendance;
  }

  /**************************************
   * COMMENT VALIDATION
   **************************************/

  /**
   * Check if user already commented on the event
   */
  async validateUniqueComment(userId: string, eventId: string) {
    const existingComment = await this.prisma.commentRating.findFirst({
      where: {
        userId,
        eventId,
        status: CommentStatus.ACTIVE,
      },
    });

    if (existingComment) {
      throw new ForbiddenException(
        'You have already submitted a comment and rating for this event',
      );
    }
  }

  /**
   * Validate comment exists and get it with event data
   */
  async validateCommentExists(id: string) {
    const commentRating = await this.prisma.commentRating.findUnique({
      where: { id },
      include: {
        event: true,
      },
    });

    if (!commentRating) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return commentRating;
  }

  /**************************************
   * UPDATE/DELETE PERMISSIONS
   **************************************/

  /**
   * Check if user can update/delete comment
   */
  async validateCommentModificationPermission(
    commentRating: any,
    userId: string,
    userRole: SystemRole,
  ) {
    const isCommentOwner = commentRating.userId === userId;
    const isEventOrganizer = commentRating.event.organizerId === userId;
    const isAdmin =
      userRole === SystemRole.ADMIN || userRole === SystemRole.SUPER_ADMIN;

    if (!isCommentOwner && !isEventOrganizer && !isAdmin) {
      throw new ForbiddenException(
        'You can only modify your own comments or comments on events you organize',
      );
    }

    return {
      isCommentOwner,
      isEventOrganizer,
      isAdmin,
    };
  }
}
