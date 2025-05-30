import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({
    description: 'Task status',
    enum: TaskStatus,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
