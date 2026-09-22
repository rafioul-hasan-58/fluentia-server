import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, Matches } from 'class-validator';

export class GetVocabularyStatsQueryDto {
  @ApiPropertyOptional({
    description:
      'Target month in YYYY-MM format to scope dateWordCounts (defaults to current month)',
    example: '2026-09',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format (e.g. 2026-09)',
  })
  month?: string;
}
