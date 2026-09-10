import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class AddMyVocabularyDto {
  @ApiProperty({
    description:
      'The MongoDB ObjectId of the global Vocabulary item to add to personal collection',
    example: '665f1b2e1111111111111111',
  })
  @IsString({ message: 'wordId must be a string' })
  @IsNotEmpty({ message: 'wordId cannot be empty' })
  @IsMongoId({ message: 'wordId must be a valid MongoDB ObjectId' })
  wordId!: string;
}
