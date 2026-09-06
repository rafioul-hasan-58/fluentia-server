import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { S3Service } from './s3.service';

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const map: Record<string, string> = {
                S3_BUCKET_NAME: 'medsyst',
                S3_REGION: 'eu-north-1',
                S3_ENDPOINT: 'https://s3.eu-north-1.amazonaws.com',
                S3_ACCESS_KEY: 'mock-access-key',
                S3_SECRET_KEY: 'mock-secret-key',
              };
              return map[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile validation', () => {
    it('should throw BadRequestException if file is missing', async () => {
      await expect(
        service.uploadFile(undefined as unknown as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if mime type is not allowed', async () => {
      const invalidFile = {
        buffer: Buffer.from('test'),
        mimetype: 'application/pdf',
        originalname: 'doc.pdf',
        size: 100,
      } as Express.Multer.File;

      await expect(service.uploadFile(invalidFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if file size exceeds 10MB', async () => {
      const hugeFile = {
        buffer: Buffer.alloc(11 * 1024 * 1024),
        mimetype: 'image/png',
        originalname: 'huge.png',
        size: 11 * 1024 * 1024,
      } as Express.Multer.File;

      await expect(service.uploadFile(hugeFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteFile', () => {
    it('should handle undefined or null keyOrUrl gracefully', async () => {
      await expect(service.deleteFile(undefined)).resolves.toBeUndefined();
      await expect(service.deleteFile(null)).resolves.toBeUndefined();
    });
  });
});
