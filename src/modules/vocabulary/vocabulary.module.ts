import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { VocabularyController } from './vocabulary.controller';
import { MyVocabularyController } from './my-vocabulary.controller';
import { VocabularyService } from './vocabulary.service';

@Module({
  imports: [PrismaModule, AuthModule, AiModule],
  controllers: [VocabularyController, MyVocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
