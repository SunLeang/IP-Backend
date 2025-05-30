import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { TaskStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Task description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Task type' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Task due date' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ description: 'Event ID' })
  @IsUUID()
  @IsNotEmpty()
  eventId: string;

  @ApiPropertyOptional({
    description: 'Task status',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
