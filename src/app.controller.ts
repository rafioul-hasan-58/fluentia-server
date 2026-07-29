import { Controller, Get, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';

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
}
