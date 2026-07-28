import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Bootstrap starting...');
  try {
    const app = await NestFactory.create(AppModule);
    console.log('Nest application created.');
    await app.listen(process.env.PORT ?? 3000);
    console.log(
      'Nest application is listening on port:',
      process.env.PORT ?? 3000,
    );
  } catch (error) {
    console.error('Error during bootstrap:', error);
  }
}
void bootstrap();
