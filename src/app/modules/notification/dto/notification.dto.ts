import { IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { NotificationType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Type of notification', enum: NotificationType })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'User ID to send notification to' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ description: 'Related event ID' })
  @IsUUID()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional({ description: 'Related application ID' })
  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional({ description: 'Related announcement ID' })
  @IsUUID()
  @IsOptional()
  announcementId?: string;
}

export class UpdateNotificationDto {
  @ApiProperty({ description: 'Read status' })
  @IsBoolean()
  @IsNotEmpty()
  read: boolean;
}