import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class TeachRequestDto {
  @ApiProperty({
    description: 'Unique slug matching an existing Skill in the taxonomy',
    example: 'present_perfect',
  })
  @IsString({ message: 'skillSlug must be a string' })
  @IsNotEmpty({ message: 'skillSlug is required and cannot be empty' })
  skillSlug!: string;

  @ApiPropertyOptional({
    description:
      'Optional free-text context, question, or confusion provided by the learner (max 500 characters)',
    example: 'I keep mixing up have vs has',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'userPrompt must be a string' })
  @MaxLength(500, {
    message: 'userPrompt cannot exceed 500 characters',
  })
  userPrompt?: string;
}
