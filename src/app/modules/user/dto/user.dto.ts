import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsNumber, Min, Max } from 'class-validator';
import { SystemRole, CurrentRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Username' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ description: 'Gender' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ description: 'Age of the user' })
  @IsNumber()
  @Min(13)
  @Max(120)
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({ description: 'Organization the user belongs to' })
  @IsString()
  @IsOptional()
  org?: string;

  @ApiPropertyOptional({ 
    description: 'System role of the user',
    enum: SystemRole,
    default: SystemRole.USER
  })
  @IsEnum(SystemRole)
  @IsOptional()
  systemRole?: SystemRole;

  @ApiPropertyOptional({ 
    description: 'Current role of the user',
    enum: CurrentRole,
    default: CurrentRole.ATTENDEE
  })
  @IsEnum(CurrentRole)
  @IsOptional()
  currentRole?: CurrentRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Username' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ description: 'User password' })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ description: 'Full name of the user' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Gender' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ description: 'Age of the user' })
  @IsNumber()
  @Min(13)
  @Max(120)
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({ description: 'Organization the user belongs to' })
  @IsString()
  @IsOptional()
  org?: string;

  @ApiPropertyOptional({ 
    description: 'System role of the user',
    enum: SystemRole
  })
  @IsEnum(SystemRole)
  @IsOptional()
  systemRole?: SystemRole;

  @ApiPropertyOptional({ 
    description: 'Current role of the user',
    enum: CurrentRole
  })
  @IsEnum(CurrentRole)
  @IsOptional()
  currentRole?: CurrentRole;
}

export class LoginDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}