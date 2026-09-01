import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SkillsModule } from '../skills/skills.module';
import { AiModule } from '../ai/ai.module';
import { GrammarController } from './grammar.controller';
import { GrammarService } from './grammar.service';

@Module({
  imports: [PrismaModule, SkillsModule, AiModule],
  controllers: [GrammarController],
  providers: [GrammarService],
  exports: [GrammarService],
})
export class GrammarModule {}
