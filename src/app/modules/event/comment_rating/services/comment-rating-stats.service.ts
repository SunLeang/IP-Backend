import { Injectable } from '@nestjs/common';
import { CommentStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/services/prisma.service';
import { CommentRatingPermissionService } from './comment-rating-permission.service';

@Injectable()
export class CommentRatingStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: CommentRatingPermissionService,
  ) {}

  /**************************************
   * RATING STATISTICS
   **************************************/

  /**
   * Get comments and ratings statistics for an event
   */
  async getEventRatingStats(eventId: string) {
    // Validate event exists
    await this.permissionService.validateEventAccess(eventId);

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
    const ratingCounts = await this.getRatingDistribution(eventId);

    return {
      averageRating: aggregations._avg.rating || 0,
      totalRatings: aggregations._count.rating || 0,
      highestRating: aggregations._max.rating || 0,
      lowestRating: aggregations._min.rating || 0,
      ratingDistribution: ratingCounts,
    };
  }

  /**************************************
   * PRIVATE HELPER METHODS
   **************************************/

  /**
   * Get rating distribution (count for each rating 1-5)
   */
  private async getRatingDistribution(eventId: string) {
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

    return ratingCounts;
  }
}
