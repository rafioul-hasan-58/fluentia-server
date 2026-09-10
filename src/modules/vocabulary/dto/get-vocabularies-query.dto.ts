import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnglishLevel, PartOfSpeech } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetVocabulariesQueryDto {
  @ApiPropertyOptional({
    description:
      'Search query matching word, English meaning, or Bangla meaning',
    example: 'significant',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by part of speech',
    enum: PartOfSpeech,
    example: PartOfSpeech.ADJECTIVE,
  })
  @IsOptional()
  @IsEnum(PartOfSpeech, {
    message: `partOfSpeech must be a valid PartOfSpeech enum value`,
  })
  partOfSpeech?: PartOfSpeech;

  @ApiPropertyOptional({
    description: 'Filter by CEFR English level (A1, A2, B1, B2, C1, C2)',
    enum: EnglishLevel,
    example: EnglishLevel.B1,
  })
  @IsOptional()
  @IsEnum(EnglishLevel, {
    message: `englishLevel must be one of: A1, A2, B1, B2, C1, C2`,
  })
  englishLevel?: EnglishLevel;

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
