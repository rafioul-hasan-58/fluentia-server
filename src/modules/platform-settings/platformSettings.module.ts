import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlatformSettingsService } from './platformSettings.service';
import { PlatformSettingsController } from './platformSettings.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PlatformSettingsController],
  providers: [PlatformSettingsService],
  exports: [PlatformSettingsService],
})
export class PlatformSettingsModule { }
