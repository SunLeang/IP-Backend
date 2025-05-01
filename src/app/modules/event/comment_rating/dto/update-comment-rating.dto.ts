import { IsOptional, IsInt, IsString, Min, Max, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CommentStatus } from '@prisma/client';

export class UpdateCommentRatingDto {
  @ApiPropertyOptional({
    description: 'Comment text about the event',
    example: 'Updated: This was an excellent event with great speakers!',
  })
  @IsString()
  @IsOptional()
  commentText?: string;

  @ApiPropertyOptional({
    description: 'Rating for the event (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({
    description: 'Status of the comment',
    enum: CommentStatus,
    example: 'ACTIVE',
  })
  @IsEnum(CommentStatus)
  @IsOptional()
  status?: CommentStatus;
}
