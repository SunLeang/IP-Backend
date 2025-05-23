import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class CreateAssignmentDto {
  @IsString()
  taskId: string;

  @IsString()
  volunteerId: string;

  @IsString()
  assignedById: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
