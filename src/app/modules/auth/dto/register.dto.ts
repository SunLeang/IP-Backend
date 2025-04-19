import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { SystemRole, CurrentRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  org?: string;

  @IsEnum(SystemRole)
  @IsOptional()
  systemRole?: SystemRole = SystemRole.USER;

  @IsEnum(CurrentRole)
  @IsOptional()
  currentRole?: CurrentRole = CurrentRole.ATTENDEE;
}
