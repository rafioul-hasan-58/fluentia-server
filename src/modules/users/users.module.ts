import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { S3Module } from '../s3';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [PrismaModule, S3Module],
  providers: [UsersRepository, UsersService],
  exports: [UsersRepository, UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
