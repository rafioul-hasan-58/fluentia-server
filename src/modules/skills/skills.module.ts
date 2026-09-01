import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SkillsService } from './skills.service';

@Module({
  imports: [PrismaModule],
  providers: [SkillsService],
  exports: [SkillsService],
})
export class SkillsModule {}
