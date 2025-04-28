// src/app/modules/volunteer/dto/create-volunteer-application.dto.ts
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVolunteerApplicationDto {
  @ApiProperty({
    description: 'Explanation of why the user wants to volunteer',
  })
  @IsString()
  @IsNotEmpty()
  whyVolunteer: string;

  @ApiProperty({ description: 'Path to uploaded CV file' })
  @IsString()
  @IsNotEmpty()
  cvPath: string;

  @ApiProperty({ description: 'ID of the event to volunteer for' })
  @IsUUID()
  @IsNotEmpty()
  eventId: string;
}
