import { PartialType } from '@nestjs/mapped-types';
import { CreateAssignmentDto } from './create-assignment.dto';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {}
