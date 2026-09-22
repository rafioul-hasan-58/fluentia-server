import { ApiPropertyOptional } from '@nestjs/swagger';
import { VocabularyStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateMyVocabularyDto {
  @ApiPropertyOptional({
    description: 'Personal user-written example sentences using this word',
    example: ['I noticed a significant improvement in my speaking confidence.'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'mySentences must be an array of strings' })
  @IsString({ each: true, message: 'Each sentence must be a string' })
  mySentences?: string[];

  @ApiPropertyOptional({
    description: 'Personal study notes, mnemonic aids, or reminders',
    example: 'Remember to use with prepositions "in" or "for".',
  })
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Mastery level percentage score (0 to 100)',
    example: 60,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt({ message: 'masteryLevel must be an integer' })
  @Min(0, { message: 'masteryLevel cannot be less than 0' })
  @Max(100, { message: 'masteryLevel cannot exceed 100' })
  masteryLevel?: number;

  @ApiPropertyOptional({
    description: 'Personal learning status (LEARNING, LEARNED, MASTERED)',
    enum: VocabularyStatus,
    example: VocabularyStatus.LEARNED,
  })
  @IsOptional()
  @IsEnum(VocabularyStatus, {
    message: 'vocabularyStatus must be one of: LEARNING, LEARNED, MASTERED',
  })
  vocabularyStatus?: VocabularyStatus;

  @ApiPropertyOptional({
    description: 'Flag indicating whether this word is starred/favorited',
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
}
