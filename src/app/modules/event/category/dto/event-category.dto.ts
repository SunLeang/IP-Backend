import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventCategoryDto {
  @ApiProperty({ description: 'Name of the category' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Image URL for the category' })
  @IsString()
  @IsOptional()
  image?: string;
}

export class UpdateEventCategoryDto {
  @ApiPropertyOptional({ description: 'Name of the category' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Image URL for the category' })
  @IsString()
  @IsOptional()
  image?: string;
}