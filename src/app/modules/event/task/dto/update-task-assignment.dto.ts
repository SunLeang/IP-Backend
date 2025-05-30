import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskAssignmentDto {
  @ApiPropertyOptional({
    description: 'Task assignment status',
    enum: TaskStatus,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
