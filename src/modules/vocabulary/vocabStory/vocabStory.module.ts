import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthModule } from '../../../auth/auth.module';
import { AiModule } from '../../ai/ai.module';
import { VocabStoryController } from './vocabStory.controller';
import { VocabStoryService } from './vocabStory.service';
import { MyVocabularyModule } from '../myVocabulary';

@Module({
  imports: [PrismaModule, AuthModule, AiModule, MyVocabularyModule],
  controllers: [VocabStoryController],
  providers: [VocabStoryService],
  exports: [VocabStoryService],
})
export class VocabStoryModule { }
