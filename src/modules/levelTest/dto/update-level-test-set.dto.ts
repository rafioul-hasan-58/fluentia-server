import { PartialType } from '@nestjs/swagger';
import { CreateLevelTestSetDto } from './create-level-test-set.dto';

export class UpdateLevelTestSetDto extends PartialType(CreateLevelTestSetDto) {}
