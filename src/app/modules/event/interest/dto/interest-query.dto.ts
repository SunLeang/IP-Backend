import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class InterestQueryDto {
  @ApiPropertyOptional({
    description: 'Search by user name or email',
    example: 'john',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Number of records to skip for pagination',
    example: 0,
  })
  @IsOptional()
  skip?: number;

  @ApiPropertyOptional({
    description: 'Number of records to take for pagination',
    example: 10,
  })
  @IsOptional()
  take?: number;
}