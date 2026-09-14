import { PartialType } from '@nestjs/swagger';
import { CreateLevelTestSetDto } from './createLevelTestSet.dto';

export class UpdateLevelTestSetDto extends PartialType(CreateLevelTestSetDto) { }
