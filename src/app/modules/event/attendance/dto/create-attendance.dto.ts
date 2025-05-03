import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceDto {
  @ApiProperty({
    description: 'User ID of the attendee',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Event ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiPropertyOptional({
    description: 'Status of attendance',
    enum: AttendanceStatus,
    default: 'REGISTERED',
    example: 'REGISTERED',
  })
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Optional notes about the attendee',
    example: 'Requires accessibility accommodations',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
