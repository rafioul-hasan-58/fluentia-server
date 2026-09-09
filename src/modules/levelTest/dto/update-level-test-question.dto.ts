import { PartialType } from '@nestjs/swagger';
import { CreateLevelTestQuestionDto } from './create-level-test-question.dto';

export class UpdateLevelTestQuestionDto extends PartialType(
  CreateLevelTestQuestionDto,
) {}
