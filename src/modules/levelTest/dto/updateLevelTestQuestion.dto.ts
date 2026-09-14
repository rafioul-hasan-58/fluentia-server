import { PartialType } from '@nestjs/swagger';
import { CreateLevelTestQuestionDto } from './createLevelTestQuestion.dto';

export class UpdateLevelTestQuestionDto extends PartialType(
  CreateLevelTestQuestionDto,
) { }
