import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthModule } from '../../../auth/auth.module';
import { VocabularyCoreModule } from '../vocabulary-core/vocabulary-core.module';
import { MyVocabularyController } from './my-vocabulary.controller';
import { MyVocabularyService } from './my-vocabulary.service';

@Module({
  imports: [PrismaModule, AuthModule, VocabularyCoreModule],
  controllers: [MyVocabularyController],
  providers: [MyVocabularyService],
  exports: [MyVocabularyService],
})
export class MyVocabularyModule {}
