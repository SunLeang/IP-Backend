import { Module } from '@nestjs/common';
import { CommentRatingController } from './comment-rating.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

// Import All the services
import { CommentRatingService } from './services/comment-rating.service';
import { CommentRatingCoreService } from './services/comment-rating-core.service';
import { CommentRatingPermissionService } from './services/comment-rating-permission.service';
import { CommentRatingQueryService } from './services/comment-rating-query.service';
import { CommentRatingStatsService } from './services/comment-rating-stats.service';

@Module({
  imports: [PrismaModule],
  controllers: [CommentRatingController],
  providers: [
    CommentRatingService,
    CommentRatingCoreService,
    CommentRatingPermissionService,
    CommentRatingQueryService,
    CommentRatingStatsService,
  ],
  exports: [
    CommentRatingService,
    CommentRatingCoreService,
    CommentRatingPermissionService,
    CommentRatingQueryService,
    CommentRatingStatsService,
  ],
})
export class CommentRatingModule {}