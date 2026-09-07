import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  DifficultyType,
  EnglishLevel,
  TestQuestionSection,
} from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetLevelTestQuestionsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by CEFR proficiency level (e.g. A1, A2, B1, B2, C1, C2)',
    enum: EnglishLevel,
    example: EnglishLevel.B1,
  })
  @IsOptional()
  @IsEnum(EnglishLevel, {
    message: 'level must be one of: A1, A2, B1, B2, C1, C2',
  })
  level?: EnglishLevel;

  @ApiPropertyOptional({
    description: 'Filter by section category (e.g. GRAMMAR, VOCABULARY, READING)',
    enum: TestQuestionSection,
    example: TestQuestionSection.GRAMMAR,
  })
  @IsOptional()
  @IsEnum(TestQuestionSection, {
    message: 'sectionType must be one of: GRAMMAR, VOCABULARY, READING',
  })
  sectionType?: TestQuestionSection;

  @ApiPropertyOptional({
    description: 'Filter by difficulty classification (e.g. EASY, MEDIUM, HARD)',
    enum: DifficultyType,
    example: DifficultyType.MEDIUM,
  })
  @IsOptional()
  @IsEnum(DifficultyType, {
    message: 'difficulty must be one of: EASY, MEDIUM, HARD',
  })
  difficulty?: DifficultyType;

  @ApiPropertyOptional({
    description: 'Search keyword matching within question text or passage',
    example: 'Spain',
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
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit cannot exceed 100' })
  limit?: number = 20;
}
