import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { PlatformSettingsModule } from '../platformSettings';

@Module({
  imports: [ConfigModule, PlatformSettingsModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
