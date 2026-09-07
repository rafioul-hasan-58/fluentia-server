import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { validateConfig } from './config/env.schema';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users';
import { HealthModule } from './health/health.module';
import { SkillsModule } from './modules/skills';
import { AiModule } from './modules/ai';
import { GrammarModule } from './modules/grammar';
import { MailModule } from './modules/mail';
import { S3Module } from './modules/s3';
import { LevelTestQuestionsModule } from './modules/level-test-questions';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfig,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    HealthModule,
    SkillsModule,
    AiModule,
    GrammarModule,
    MailModule,
    S3Module,
    LevelTestQuestionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
