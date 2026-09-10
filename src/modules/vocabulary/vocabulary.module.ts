import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { VocabularyController } from './vocabulary.controller';
import { MyVocabularyController } from './my-vocabulary.controller';
import { VocabStoryController } from './vocab-story.controller';
import { VocabularyService } from './vocabulary.service';
import { VocabStoryService } from './vocab-story.service';

@Module({
  imports: [PrismaModule, AuthModule, AiModule],
  controllers: [
    VocabularyController,
    MyVocabularyController,
    VocabStoryController,
  ],
  providers: [VocabularyService, VocabStoryService],
  exports: [VocabularyService, VocabStoryService],
})
export class VocabularyModule {}
