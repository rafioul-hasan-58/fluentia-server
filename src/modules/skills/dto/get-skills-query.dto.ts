import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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
      'Filter skills by CEFR proficiency level (e.g. A1, A2, B1, B2, C1)',
    example: 'B1',
  })
  @IsOptional()
  @IsString()
  cefr?: string;

  @ApiPropertyOptional({
    description: 'Search term to filter skills by name or slug',
    example: 'perfect',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
