import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'First name of the user',
    example: 'Rafioul',
  })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Hasan Sourob',
  })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  lastName?: string;

  @ApiPropertyOptional({
    description:
      'Profile image URL (optional if uploading image file via multipart form)',
    example: 'https://medsyst.s3.eu-north-1.amazonaws.com/avatars/avatar.jpg',
  })
  @IsOptional()
  @IsString({ message: 'profileImage must be a string' })
  profileImage?: string;

  @ApiPropertyOptional({
    description: 'Short bio or about me description',
    example:
      'English enthusiast passionate about mastering fluent conversation.',
  })
  @IsOptional()
  @IsString({ message: 'bio must be a string' })
  @MaxLength(500, { message: 'bio cannot exceed 500 characters' })
  bio?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+8801700000000',
  })
  @IsOptional()
  @IsString({ message: 'phoneNumber must be a string' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Country of residence',
    example: 'Bangladesh',
  })
  @IsOptional()
  @IsString({ message: 'country must be a string' })
  country?: string;

  @ApiPropertyOptional({
    description: 'Timezone identifier (e.g., Asia/Dhaka, America/New_York)',
    example: 'Asia/Dhaka',
  })
  @IsOptional()
  @IsString({ message: 'timezone must be a string' })
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Target English proficiency level or exam score target',
    example: 'B2',
  })
  @IsOptional()
  @IsString({ message: 'targetLevel must be a string' })
  targetLevel?: string;

  @ApiPropertyOptional({
    description:
      'Current estimated or self-reported CEFR level (A1, A2, B1, B2, C1, C2)',
    example: 'B1',
  })
  @IsOptional()
  @IsString({ message: 'estimatedCEFR must be a string' })
  estimatedCEFR?: string;

  @ApiPropertyOptional({
    description: "User's native / primary language",
    example: 'Bengali',
  })
  @IsOptional()
  @IsString({ message: 'nativeLanguage must be a string' })
  nativeLanguage?: string;

  @ApiPropertyOptional({
    description: 'Learning focus areas and goals',
    example: ['Speaking', 'Grammar', 'Business English', 'IELTS'],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown => {
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        return value
          .split(',')
          .map((item: string) => item.trim())
          .filter(Boolean);
      }
      return [value.trim()];
    }
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    return value;
  })
  @IsArray({ message: 'learningGoals must be an array of strings' })
  @IsString({ each: true, message: 'Each learning goal must be a string' })
  learningGoals?: string[];

  @ApiPropertyOptional({
    description: 'Daily target learning duration in minutes',
    example: 15,
    minimum: 1,
    maximum: 360,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'dailyGoalMinutes must be an integer' })
  @Min(1, { message: 'dailyGoalMinutes must be at least 1 minute' })
  @Max(360, { message: 'dailyGoalMinutes cannot exceed 360 minutes' })
  dailyGoalMinutes?: number;
}
