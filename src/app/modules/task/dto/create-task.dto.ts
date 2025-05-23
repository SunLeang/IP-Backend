import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsDate()
  @IsNotEmpty()
  dueDate: Date;

  // Relationships
  @IsString()
  @IsNotEmpty()
  eventId: string;
}
