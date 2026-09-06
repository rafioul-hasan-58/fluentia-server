import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { EnvConfig } from '../../config/env.schema';
import crypto from 'crypto';
import path from 'path';

export interface UploadResult {
  url: string;
  key: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly endpoint?: string;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    this.bucketName = this.configService.get('S3_BUCKET_NAME', { infer: true });
    this.region = this.configService.get('S3_REGION', { infer: true });
    this.endpoint = this.configService.get('S3_ENDPOINT', { infer: true });

    const accessKeyId = this.configService.get('S3_ACCESS_KEY', {
      infer: true,
    });
    const secretAccessKey = this.configService.get('S3_SECRET_KEY', {
      infer: true,
    });

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
      forcePathStyle: false,
    });
  }

  /**
   * Uploads an image file to AWS S3 and returns the public URL and key.
   */
  async uploadFile(
    file: Express.Multer.File,
    folder = 'avatars',
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided for upload');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type (${file.mimetype}). Only JPEG, PNG, WEBP, GIF, and SVG images are allowed.`,
      );
    }

    // Max 10MB file size limit for profile pictures
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        'File size exceeds maximum allowed limit of 10MB',
      );
    }

    const fileExt = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueFileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${fileExt}`;
    const key = `${folder}/${uniqueFileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      this.logger.log(`File uploaded successfully to S3: ${url}`);
      return { url, key };
    } catch (error) {
      this.logger.error(
        'Failed to upload file to S3',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Failed to upload file to S3 storage',
      );
    }
  }

  /**
   * Deletes a file from S3 by key or full S3 URL.
   */
  async deleteFile(keyOrUrl?: string | null): Promise<void> {
    if (!keyOrUrl) return;

    let key = keyOrUrl;
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
      try {
        const parsed = new URL(keyOrUrl);
        key = parsed.pathname.startsWith('/')
          ? parsed.pathname.slice(1)
          : parsed.pathname;
      } catch {
        key = keyOrUrl;
      }
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.warn(
        `Failed to delete file from S3: ${key}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
