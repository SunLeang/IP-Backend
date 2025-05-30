import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator';
import { TaskStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class TaskQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ description: 'Filter by event ID' })
  @IsUUID()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional({ description: 'Filter by volunteer ID' })
  @IsUUID()
  @IsOptional()
  volunteerId?: string;

  @ApiPropertyOptional({ description: 'Search by task name or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Number of records to skip', default: 0 })
  @Transform(({ value }) => parseInt(value) || 0)
  @IsOptional()
  skip?: number;

  @ApiPropertyOptional({
    description: 'Number of records to take',
    default: 10,
  })
  @Transform(({ value }) => parseInt(value) || 10)
  @IsOptional()
  take?: number;
}
