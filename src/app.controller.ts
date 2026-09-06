import {
  Controller,
  Get,
  Post,
  Body,
  NotFoundException,
  UseGuards,
  Res,
  Req,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppService } from './app.service';
import z from 'zod';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe';
import { testUserSchema } from './shared/dto/test-user.dto';
import type { TestUserDto } from './shared/dto/test-user.dto';
import { AuthGuard } from './common/guards/auth.guard';

@ApiTags('App')
@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiExcludeEndpoint()
  getWelcome(@Req() req: Request, @Res() res: Response) {
    const acceptHeader = req.headers['accept'] || '';
    if (
      acceptHeader.includes('application/json') &&
      !acceptHeader.includes('text/html')
    ) {
      return res.json({
        success: true,
        statusCode: 200,
        message: 'Welcome to Fluentia Server API!',
        data: {
          name: 'Fluentia Server',
          version: '1.0.0',
          docs: '/api/docs',
          health: '/api/v1/health',
          status: 'online',
        },
        timestamp: new Date().toISOString(),
      });
    }

    return res.type('html').send(this.appService.getWelcomeHtml());
  }

  @Get('hello')
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
