import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetVocabularyStatsQueryDto {
  @ApiPropertyOptional({
    description:
      'Client timezone (e.g. "Asia/Dhaka", "America/New_York", "UTC") to compute today\'s word boundaries',
    example: 'Asia/Dhaka',
  })
  @IsOptional()
  @IsString()
  timeZone?: string;

  @ApiPropertyOptional({
    description:
      "Specific reference date for today's word calculation (format: YYYY-MM-DD)",
    example: '2026-09-22',
  })
  @IsOptional()
  @IsString()
  date?: string;
}
