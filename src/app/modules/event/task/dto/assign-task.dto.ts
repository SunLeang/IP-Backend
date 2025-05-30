import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTaskDto {
  @ApiProperty({ description: 'Volunteer ID to assign the task to' })
  @IsUUID()
  @IsNotEmpty()
  volunteerId: string;
}
