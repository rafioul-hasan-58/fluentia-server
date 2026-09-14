import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLevelTestSetDto {
  @ApiProperty({
    description:
      'Unique name of the level test set (e.g. Set 1, Set 2, General Placement Set A)',
    example: 'Set 1',
  })
  @IsNotEmpty({ message: 'Set name cannot be empty' })
  @IsString({ message: 'Set name must be a string' })
  name: string;

  @ApiPropertyOptional({
    description:
      'Optional description or target audience/topic for this test set',
    example: 'Standard placement test set covering A1 to C1 levels',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the test set is currently active for assessments',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Optional list of existing question IDs to associate with this set on creation',
    example: ['665f1b2e1111111111111111', '665f1b2e2222222222222222'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'questionIds must be an array of string IDs' })
  @IsString({ each: true, message: 'Each question ID must be a string' })
  questionIds?: string[];
}
