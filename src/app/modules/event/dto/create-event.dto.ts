import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsDate,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { EventStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  profileImage?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  dateTime: Date;

  @IsString()
  @IsNotEmpty()
  locationDesc: string;

  @IsString()
  @IsOptional()
  locationImage?: string;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus = EventStatus.DRAFT;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsBoolean()
  @IsOptional()
  acceptingVolunteers?: boolean = false;
}
