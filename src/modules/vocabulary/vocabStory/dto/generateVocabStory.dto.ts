import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class GenerateVocabStoryDto {
  @ApiProperty({
    description:
      'Array of Vocabulary MongoDB ObjectId strings (supports 5 or 10 vocabulary words)',
    example: [
      '665f1b2e1111111111111111',
      '665f1b2e2222222222222222',
      '665f1b2e3333333333333333',
      '665f1b2e4444444444444444',
      '665f1b2e5555555555555555',
    ],
    type: [String],
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value as string[];
    return [];
  })
  @IsArray({ message: 'vocabularyIds must be an array of string IDs' })
  @ArrayNotEmpty({
    message: 'vocabularyIds must contain at least 1 vocabulary ID',
  })
  @IsString({ each: true, message: 'Each vocabularyId must be a valid string' })
  vocabularyIds!: string[];

  @ApiPropertyOptional({
    description:
      'Optional storytelling theme, context, or scenario requested by user',
    example: 'Give me a cricket example',
  })
  @IsOptional()
  @IsString({ message: 'context must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  context?: string;
}
