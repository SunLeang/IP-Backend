import { Module } from '@nestjs/common';
import { CommentRatingService } from './comment-rating.service';
import { CommentRatingController } from './comment-rating.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommentRatingController],
  providers: [CommentRatingService],
  exports: [CommentRatingService],
})
export class CommentRatingModule {}
