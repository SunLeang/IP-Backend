import { Injectable } from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { CreateCommentRatingDto } from '../dto/create-comment-rating.dto';
import { UpdateCommentRatingDto } from '../dto/update-comment-rating.dto';
import { CommentRatingCoreService } from './comment-rating-core.service';
import { CommentRatingQueryService } from './comment-rating-query.service';
import { CommentRatingStatsService } from './comment-rating-stats.service';


@Injectable()
export class CommentRatingService {
  constructor(
    private readonly coreService: CommentRatingCoreService,
    private readonly queryService: CommentRatingQueryService,
    private readonly statsService: CommentRatingStatsService,
  ) {}

  /**************************************
   * CREATE OPERATIONS (DELEGATED)
   **************************************/

  async create(createCommentRatingDto: CreateCommentRatingDto, userId: string) {
    return this.coreService.create(createCommentRatingDto, userId);
  }

  /**************************************
   * QUERY OPERATIONS (DELEGATED)
   **************************************/

  async findAllForEvent(eventId: string) {
    return this.queryService.findAllForEvent(eventId);
  }

  async findOne(id: string) {
    return this.queryService.findOne(id);
  }

  async findAllByUser(userId: string) {
    return this.queryService.findAllByUser(userId);
  }

  /**************************************
   * STATISTICS OPERATIONS (DELEGATED)
   **************************************/

  async getEventRatingStats(eventId: string) {
    return this.statsService.getEventRatingStats(eventId);
  }

  /**************************************
   * UPDATE OPERATIONS (DELEGATED)
   **************************************/

  async update(
    id: string,
    updateCommentRatingDto: UpdateCommentRatingDto,
    userId: string,
    userRole: SystemRole,
  ) {
    return this.coreService.update(
      id,
      updateCommentRatingDto,
      userId,
      userRole,
    );
  }

  /**************************************
   * DELETE OPERATIONS (DELEGATED)
   **************************************/

  async remove(id: string, userId: string, userRole: SystemRole) {
    return this.coreService.remove(id, userId, userRole);
  }
}
