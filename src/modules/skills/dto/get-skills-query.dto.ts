import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnglishLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetSkillsQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter skills by category (e.g. verb_tenses, conditionals, modals)',
    example: 'verb_tenses',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description:
      'Filter skills by CEFR proficiency level (e.g. A1, A2, B1, B2, C1, C2)',
    example: 'B1',
    enum: EnglishLevel,
  })
  @IsOptional()
  @IsEnum(EnglishLevel, {
    message: 'cefr must be one of: A1, A2, B1, B2, C1, C2',
  })
  cefr?: EnglishLevel;

  @ApiPropertyOptional({
    description: 'Search term to filter skills by name or slug',
    example: 'perfect',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
