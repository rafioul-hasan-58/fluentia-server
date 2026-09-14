import { Module } from '@nestjs/common';
import { VocabularyCoreModule } from './vocabulary-core/vocabulary-core.module';
import { MyVocabularyModule } from './my-vocabulary/my-vocabulary.module';
import { VocabStoryModule } from './vocab-story/vocab-story.module';

@Module({
  imports: [VocabularyCoreModule, MyVocabularyModule, VocabStoryModule],
  exports: [VocabularyCoreModule, MyVocabularyModule, VocabStoryModule],
})
export class VocabularyModule {}
