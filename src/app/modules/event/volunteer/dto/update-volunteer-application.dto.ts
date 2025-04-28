// src/app/modules/volunteer/dto/update-volunteer-application.dto.ts
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';

export class UpdateVolunteerApplicationDto {
  @ApiProperty({
    description: 'Status of the application',
    enum: ApplicationStatus,
  })
  @IsEnum(ApplicationStatus)
  @IsNotEmpty()
  status: ApplicationStatus;
}
