import { IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { EventStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ description: 'Name of the event' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Description of the event' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  @IsString()
  @IsOptional()
  profileImage?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiProperty({ description: 'Date and time of the event' })
  @IsDateString()
  @IsNotEmpty()
  dateTime: string;

  @ApiProperty({ description: 'Location description' })
  @IsString()
  @IsNotEmpty()
  locationDesc: string;

  @ApiPropertyOptional({ description: 'Location image URL' })
  @IsString()
  @IsOptional()
  locationImage?: string;

  @ApiPropertyOptional({ 
    description: 'Status of the event',
    enum: EventStatus,
    default: EventStatus.DRAFT
  })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiProperty({ description: 'Category ID of the event' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;
}

export class UpdateEventDto {
  @ApiPropertyOptional({ description: 'Name of the event' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the event' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  @IsString()
  @IsOptional()
  profileImage?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Date and time of the event' })
  @IsDateString()
  @IsOptional()
  dateTime?: string;

  @ApiPropertyOptional({ description: 'Location description' })
  @IsString()
  @IsOptional()
  locationDesc?: string;

  @ApiPropertyOptional({ description: 'Location image URL' })
  @IsString()
  @IsOptional()
  locationImage?: string;

  @ApiPropertyOptional({ 
    description: 'Status of the event',
    enum: EventStatus
  })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiPropertyOptional({ description: 'Category ID of the event' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}