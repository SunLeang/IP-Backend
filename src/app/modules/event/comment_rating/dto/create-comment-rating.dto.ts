import { IsNotEmpty, IsInt, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentRatingDto {
  @ApiProperty({
    description: 'Comment text about the event',
    example:
      'This was an excellent event with great speakers and networking opportunities.',
  })
  @IsString()
  @IsNotEmpty()
  commentText: string;

  @ApiProperty({
    description: 'Rating for the event (1-5)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Event ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  eventId: string;
}
