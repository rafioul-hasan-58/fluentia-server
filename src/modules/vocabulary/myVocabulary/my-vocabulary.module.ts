import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthModule } from '../../../auth/auth.module';
import { MyVocabularyController } from './my-vocabulary.controller';
import { MyVocabularyService } from './my-vocabulary.service';
import { VocabularyCoreModule } from '../vocabularyCore';

@Module({
  imports: [PrismaModule, AuthModule, VocabularyCoreModule],
  controllers: [MyVocabularyController],
  providers: [MyVocabularyService],
  exports: [MyVocabularyService],
})
export class MyVocabularyModule {}
