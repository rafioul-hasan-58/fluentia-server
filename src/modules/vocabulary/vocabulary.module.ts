import { Module } from '@nestjs/common';
import { VocabularyCoreModule } from './vocabularyCore';
import { MyVocabularyModule } from './myVocabulary';
import { VocabStoryModule } from './vocabStory';
@Module({
  imports: [VocabularyCoreModule, MyVocabularyModule, VocabStoryModule],
  exports: [VocabularyCoreModule, MyVocabularyModule, VocabStoryModule],
})
export class VocabularyModule {}
