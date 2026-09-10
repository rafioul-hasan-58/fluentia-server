import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class GenerateVocabularyDto {
  @ApiProperty({
    description: 'The English word or collocation to lookup or generate',
    example: 'significant',
    minLength: 1,
    maxLength: 100,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: 'word must be a string' })
  @IsNotEmpty({ message: 'word cannot be empty' })
  @MinLength(1, { message: 'word must be at least 1 character long' })
  @MaxLength(100, { message: 'word cannot exceed 100 characters' })
  word!: string;
}
