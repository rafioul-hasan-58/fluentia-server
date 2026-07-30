import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './config/env.schema';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  console.log('Bootstrap starting...');
  try {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // strips properties not defined in the DTO
        forbidNonWhitelisted: true, // throws if extra unknown properties are sent
        transform: true, // auto-converts payloads into DTO class instances
      }),
    );
    const configService = app.get(ConfigService<EnvConfig, true>);
    const port = configService.get('PORT', { infer: true });

    const config = new DocumentBuilder()
      .setTitle('NestJS Starter Pack API')
      .setDescription('The starter pack API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, documentFactory);

    await app.listen(port);
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (error) {
    console.error('Error during bootstrap:', error);
  }
}
void bootstrap();
