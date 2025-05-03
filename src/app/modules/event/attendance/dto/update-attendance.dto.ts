import { IsEnum, IsOptional, IsDate } from 'class-validator';
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
}
