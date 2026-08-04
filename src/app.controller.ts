import {
  Controller,
  Get,
  Post,
  Body,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import z from 'zod';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe';
import { testUserSchema } from './shared/dto/test-user.dto';
import type { TestUserDto } from './shared/dto/test-user.dto';
import { AuthGuard } from './common/guards/auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello() {
    const result = await this.appService.getHello();
    return {
      message: 'Fetched Successfully!',
      data: result,
    };
  }

  @Get('test-error')
  testError() {
    throw new NotFoundException('This is a test-error');
  }

  @Get('test-zod')
  testZod() {
    const schema = z.object({ name: z.string() });
    schema.parse({ name: 1234 });
  }

  @Get('test-prisma')
  async testPrisma() {
    return this.appService.triggerNotFound();
  }

  @Post('test-validate')
  testValidate(@Body(new ZodValidationPipe(testUserSchema)) dto: TestUserDto) {
    return { message: 'Validation passed', data: dto };
  }

  @Get('test-protected')
  @UseGuards(AuthGuard)
  testProtected() {
    return {
      message: 'Protected route accessed successfully!',
      data: { secret: 'This is protected data' },
    };
  }
}
