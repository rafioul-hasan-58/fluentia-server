import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SubmitAnswerItemDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the question',
    example: '665f1b2e2222222222222222',
  })
  @IsMongoId({ message: 'questionId must be a valid MongoDB ObjectId' })
  @IsNotEmpty()
  questionId!: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the selected question option',
    example: '665f1b2e3333333333333333',
  })
  @IsOptional()
  @IsString()
  answerOptionId?: string;

  @ApiPropertyOptional({
    description: 'Alternative alias for answerOptionId',
    example: '665f1b2e3333333333333333',
  })
  @IsOptional()
  @IsString()
  selectedOptionId?: string;

  @ApiPropertyOptional({
    description: 'Direct answer text if submitted directly',
    example: 'have lived',
  })
  @IsOptional()
  @IsString()
  userAnswer?: string;
}

export class SubmitLevelTestDto {
  @ApiProperty({
    description: 'List of submitted answers for the level test',
    type: [SubmitAnswerItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerItemDto)
  answers!: SubmitAnswerItemDto[];

  @ApiPropertyOptional({
    description: 'Total time spent taking the test in seconds',
    example: 492,
  })
  @IsOptional()
  timeSpentSeconds?: number;

  @ApiPropertyOptional({
    description: 'Duration string (e.g. "8m 12s", "08:12") or time in seconds',
    example: '8m 12s',
  })
  @IsOptional()
  duration?: string | number;

  @ApiPropertyOptional({
    description: 'Alternative alias for time spent taking the test',
    example: 492,
  })
  @IsOptional()
  timeSpent?: string | number;
}
