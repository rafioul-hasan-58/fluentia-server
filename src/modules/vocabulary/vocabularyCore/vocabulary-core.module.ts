import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthModule } from '../../../auth/auth.module';
import { AiModule } from '../../ai/ai.module';
import { VocabularyCoreController } from './vocabulary-core.controller';
import { VocabularyCoreService } from './vocabulary-core.service';

@Module({
  imports: [PrismaModule, AuthModule, AiModule],
  controllers: [VocabularyCoreController],
  providers: [VocabularyCoreService],
  exports: [VocabularyCoreService],
})
export class VocabularyCoreModule {}
