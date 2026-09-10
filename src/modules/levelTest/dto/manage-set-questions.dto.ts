import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ManageSetQuestionsDto {
  @ApiProperty({
    description: 'Array of question IDs to add or remove',
    example: ['665f1b2e1111111111111111', '665f1b2e2222222222222222'],
    type: [String],
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value as string[];
    return [];
  })
  @IsArray({ message: 'questionIds must be an array of strings' })
  @ArrayNotEmpty({ message: 'questionIds must not be empty' })
  @IsString({ each: true, message: 'Each question ID must be a string' })
  questionIds!: string[];

  getNormalizedQuestionIds(): string[] {
    const ids = new Set<string>();
    if (Array.isArray(this.questionIds)) {
      this.questionIds.forEach((id) => {
        if (typeof id === 'string' && id.trim()) {
          ids.add(id.trim());
        }
      });
    }
    return Array.from(ids);
  }
}
