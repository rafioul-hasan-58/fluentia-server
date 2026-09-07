import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnglishLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetSubmissionsQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter by CEFR proficiency level (e.g. A1, A2, B1, B2, C1, C2)',
    enum: EnglishLevel,
    example: EnglishLevel.B2,
  })
  @IsOptional()
  @IsEnum(EnglishLevel, {
    message: 'level must be one of: A1, A2, B1, B2, C1, C2',
  })
  level?: EnglishLevel;

  @ApiPropertyOptional({
    description: 'Search by learner first name, last name, or email',
    example: 'Elena',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination (starts from 1)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit cannot exceed 100' })
  limit?: number = 10;
}

export class GetRecentSubmissionsQueryDto {
  @ApiPropertyOptional({
    description: 'Number of recent submissions to return (default: 5)',
    example: 5,
    default: 5,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(50, { message: 'limit cannot exceed 50' })
  limit?: number = 5;
}
