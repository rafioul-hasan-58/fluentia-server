import { Module } from '@nestjs/common';
import { LevelTestQuestionsController } from './levelTest.controller';
import { LevelTestQuestionsService } from './levelTest.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [LevelTestQuestionsController],
  providers: [LevelTestQuestionsService],
  exports: [LevelTestQuestionsService],
})
export class LevelTestQuestionsModule {}
