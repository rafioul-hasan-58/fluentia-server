import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthModule } from '../../../auth/auth.module';
import { AiModule } from '../../ai/ai.module';
import { VocabularyCoreController } from './vocabularyCore.controller';
import { VocabularyCoreService } from './vocabularyCore.service';

@Module({
  imports: [PrismaModule, AuthModule, AiModule],
  controllers: [VocabularyCoreController],
  providers: [VocabularyCoreService],
  exports: [VocabularyCoreService],
})
export class VocabularyCoreModule {}
