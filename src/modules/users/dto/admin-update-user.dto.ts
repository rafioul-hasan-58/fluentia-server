import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnglishLevel, Role } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({
    description: 'User first name',
    example: 'Rafioul',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Hasan Prodhan',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: Role,
    example: Role.USER,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Suspension status of the user account',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isSuspended?: boolean;

  @ApiPropertyOptional({
    description: 'Profile avatar image URL',
    example: 'https://...',
  })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({
    description: 'User bio description',
    example: 'English learner passionate about fluent communication.',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+8801700000000',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'User country',
    example: 'Bangladesh',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'User timezone',
    example: 'Asia/Dhaka',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Estimated CEFR proficiency level',
    enum: EnglishLevel,
    example: EnglishLevel.B1,
  })
  @IsOptional()
  @IsEnum(EnglishLevel)
  estimatedCEFR?: EnglishLevel;

  @ApiPropertyOptional({
    description: 'Target CEFR level',
    enum: EnglishLevel,
    example: EnglishLevel.C1,
  })
  @IsOptional()
  @IsEnum(EnglishLevel)
  targetLevel?: EnglishLevel;
}
