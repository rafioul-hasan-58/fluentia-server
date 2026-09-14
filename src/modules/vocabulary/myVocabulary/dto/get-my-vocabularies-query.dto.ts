import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnglishLevel, PartOfSpeech, VocabularyStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
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
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'isFavourate must be a boolean' })
  isFavourate?: boolean;

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
}
