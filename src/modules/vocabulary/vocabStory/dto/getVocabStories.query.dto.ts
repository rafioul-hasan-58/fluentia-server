import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetVocabStoriesQueryDto {
  @ApiPropertyOptional({
    description: 'Search keyword matching stories or used vocabulary words',
    example: 'cricket',
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
