import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnglishLevel, PartOfSpeech, VocabularyStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GetMyVocabulariesQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter by personal learning status (LEARNING, LEARNED, MASTERED)',
    enum: VocabularyStatus,
    example: VocabularyStatus.LEARNING,
  })
  @IsOptional()
  @IsEnum(VocabularyStatus, {
    message: 'status must be one of: LEARNING, LEARNED, MASTERED',
  })
  status?: VocabularyStatus;

  @ApiPropertyOptional({
    description: 'Filter by favorite status (true or false)',
    example: true,
  })
  @IsOptional()
  @Transform(
    ({ value, obj }: { value: unknown; obj?: Record<string, unknown> }) => {
      const raw = value !== undefined ? value : obj?.isFavourate;
      if (raw === 'true' || raw === true) return true;
      if (raw === 'false' || raw === false) return false;
      return raw;
    },
  )
  @IsBoolean({ message: 'isFavorite must be a boolean' })
  isFavorite?: boolean;

  @ApiPropertyOptional({
    description:
      'Filter by creation date (YYYY-MM-DD or ISO 8601 string, e.g. 2026-09-24)',
    example: '2026-09-24',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'date must be a valid date string (e.g. YYYY-MM-DD or ISO 8601 format)',
    },
  )
  date?: string;

  @ApiPropertyOptional({
    description: 'Filter by part of speech of the associated word',
    enum: PartOfSpeech,
    example: PartOfSpeech.NOUN,
  })
  @IsOptional()
  @IsEnum(PartOfSpeech, {
    message: 'partOfSpeech must be a valid PartOfSpeech enum value',
  })
  partOfSpeech?: PartOfSpeech;

  @ApiPropertyOptional({
    description: 'Filter by CEFR level of the associated word',
    enum: EnglishLevel,
    example: EnglishLevel.B2,
  })
  @IsOptional()
  @IsEnum(EnglishLevel, {
    message: 'englishLevel must be one of: A1, A2, B1, B2, C1, C2',
  })
  englishLevel?: EnglishLevel;

  @ApiPropertyOptional({
    description:
      'Search query matching word, English meaning, or Bangla meaning',
    example: 'fluent',
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

  @ApiPropertyOptional({
    description:
      'Field to sort by (e.g. createdAt, updatedAt, masteryLevel, word.word).',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString({ message: 'sortBy must be a string' })
  sortBy?: string;

  @ApiPropertyOptional({
    description:
      'Sort order: asc (ascending) or desc (descending). Defaults to desc.',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (lower === 'asc') return 'asc';
      if (lower === 'desc') return 'desc';
    }
    return value;
  })
  @IsEnum(['asc', 'desc'], {
    message: 'sortOrder must be one of: asc, desc',
  })
  sortOrder?: 'asc' | 'desc';
}
