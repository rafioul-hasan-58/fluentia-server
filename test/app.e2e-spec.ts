import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res: request.Response) => {
        const body = res.body as Record<string, unknown>;
        expect(body.success).toBe(true);
        expect(body.statusCode).toBe(200);
        expect(body.message).toBe('Fetched Successfully!');
        expect(
          typeof body.data === 'string' && body.data.includes('Hello World!'),
        ).toBe(true);
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
