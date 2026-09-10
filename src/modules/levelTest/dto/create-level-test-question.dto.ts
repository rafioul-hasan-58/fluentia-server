import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DifficultyType,
  EnglishLevel,
  TestQuestionSection,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { QuestionOptionDto } from './question-option.dto';

export class CreateLevelTestQuestionDto {
  @ApiProperty({
    description: 'The question text or sentence prompt',
    example: 'She ___ from Spain and lives in Madrid.',
  })
  @IsNotEmpty({ message: 'Question text cannot be empty' })
  @IsString({ message: 'Question must be a string' })
  question: string;

  @ApiPropertyOptional({
    description: 'Contextual reading passage (required for READING questions)',
    example: 'In architectural discourse, adaptive reuse is an imperative...',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Passage must be a string' })
  passage?: string | null;

  @ApiProperty({
    description: 'The section category of the question',
    enum: TestQuestionSection,
    example: TestQuestionSection.GRAMMAR,
  })
  @IsEnum(TestQuestionSection, {
    message: 'sectionType must be one of: GRAMMAR, VOCABULARY, READING',
  })
  sectionType: TestQuestionSection;

  @ApiProperty({
    description: 'Target CEFR English proficiency level',
    enum: EnglishLevel,
    example: EnglishLevel.B1,
  })
  @IsEnum(EnglishLevel, {
    message: 'level must be one of: A1, A2, B1, B2, C1, C2',
  })
  level: EnglishLevel;

  @ApiProperty({
    description: 'Difficulty classification',
    enum: DifficultyType,
    example: DifficultyType.MEDIUM,
  })
  @IsEnum(DifficultyType, {
    message: 'difficulty must be one of: EASY, MEDIUM, HARD',
  })
  difficulty: DifficultyType;

  @ApiPropertyOptional({
    description:
      'Exact text content of the correct answer (optional if specified in options[].isCorrect)',
    example: 'is',
  })
  @IsOptional()
  @IsString({ message: 'Answer must be a string' })
  answer?: string;

  @ApiPropertyOptional({
    description: 'Educational rationale and explanation for the correct answer',
    example:
      '"Is" is the correct third-person singular present form of the verb "to be".',
  })
  @IsOptional()
  @IsString({ message: 'Explanation must be a string' })
  explanation?: string;

  @ApiProperty({
    description: 'Multiple choice options for the question (typically 4)',
    type: [QuestionOptionDto],
  })
  @IsArray({ message: 'Options must be an array' })
  @ArrayMinSize(2, { message: 'A question must have at least 2 options' })
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options: QuestionOptionDto[];

  @ApiPropertyOptional({
    description: 'Optional ID of the LevelTestSet this question belongs to',
    example: '665f1b2e1111111111111111',
  })
  @IsOptional()
  @IsString({ message: 'setId must be a string' })
  setId?: string;
}
