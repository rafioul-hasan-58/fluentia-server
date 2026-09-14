import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateVocabStoryTitleDto {
  @ApiProperty({
    description: 'Updated title for the vocabulary story',
    example: 'A Memorable Cricket Match',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @MaxLength(150, { message: 'Title cannot exceed 150 characters' })
  title!: string;
}
