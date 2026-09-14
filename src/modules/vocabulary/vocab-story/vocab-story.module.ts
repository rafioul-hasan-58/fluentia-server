import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthModule } from '../../../auth/auth.module';
import { AiModule } from '../../ai/ai.module';
import { MyVocabularyModule } from '../my-vocabulary/my-vocabulary.module';
import { VocabStoryController } from './vocab-story.controller';
import { VocabStoryService } from './vocab-story.service';

@Module({
  imports: [PrismaModule, AuthModule, AiModule, MyVocabularyModule],
  controllers: [VocabStoryController],
  providers: [VocabStoryService],
  exports: [VocabStoryService],
})
export class VocabStoryModule {}
