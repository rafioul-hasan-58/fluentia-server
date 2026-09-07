import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class QuestionOptionDto {
  @ApiPropertyOptional({
    description: 'Option ID (when updating existing option)',
    example: '665f1b2e2222222222222222',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Text content of the option',
    example: 'have been',
  })
  @IsNotEmpty({ message: 'Option content cannot be empty' })
  @IsString({ message: 'Option content must be a string' })
  content: string;

  @ApiPropertyOptional({
    description: 'Indicates whether this option is the correct answer',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isCorrect must be a boolean' })
  isCorrect?: boolean;
}
