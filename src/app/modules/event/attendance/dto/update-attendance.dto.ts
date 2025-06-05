import { IsEnum, IsOptional, IsDate, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateAttendanceDto {
  @ApiPropertyOptional({
    description: 'Status of attendance',
    enum: AttendanceStatus,
    example: 'JOINED',
  })
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Check-in time',
    example: '2025-05-01T12:00:00Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  checkedInAt?: Date;

  @ApiPropertyOptional({
    description: 'Check-out time',
    example: '2025-05-01T15:00:00Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  checkedOutAt?: Date;

  @ApiPropertyOptional({
    description: 'Optional notes about the attendance',
    example: 'Left early due to emergency',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'User ID of who updated this record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  updatedBy?: string;
}