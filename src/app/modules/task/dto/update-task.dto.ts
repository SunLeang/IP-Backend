import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { ApplicationStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsEnum(ApplicationStatus)
  @IsNotEmpty()
  status: ApplicationStatus;
}
