import { Module } from '@nestjs/common';
import { LevelTestQuestionsController } from './level-test-questions.controller';
import { LevelTestQuestionsService } from './level-test-questions.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LevelTestQuestionsController],
  providers: [LevelTestQuestionsService],
  exports: [LevelTestQuestionsService],
})
export class LevelTestQuestionsModule {}
