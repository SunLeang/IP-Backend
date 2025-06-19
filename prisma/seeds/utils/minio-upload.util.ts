import { Client as MinioClient } from 'minio';
import { ConfigService } from '@nestjs/config';
import {
  createMinioClient,
  MINIO_CONFIG,
} from '../../../src/app/core/config/minio.config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import * as sharp from 'sharp';

// ✅ Export the upload result interface
export interface UploadResult {
  originalUrl: string;
  thumbnailUrl: string;
  filename: string;
}

export class MinioSeedUploader {
  private minioClient: MinioClient;

  constructor() {
    // Create a simple config service for seeding
    const configService = {
      get: (key: string, defaultValue?: any) => {
        const envMap = {
          MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || 'localhost',
          MINIO_PORT: process.env.MINIO_PORT || '9000',
          MINIO_USE_SSL: process.env.MINIO_USE_SSL || 'false',
          MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || 'eventura',
          MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || 'eventura_password',
        };
        return envMap[key] || defaultValue;
      },
    } as ConfigService;

    this.minioClient = createMinioClient(configService);
  }

  async ensureBucketsExist() {
    const buckets = Object.values(MINIO_CONFIG.BUCKETS);

    for (const bucket of buckets) {
      try {
        const exists = await this.minioClient.bucketExists(bucket);
        if (!exists) {
          await this.minioClient.makeBucket(bucket);
          console.log(`✅ Created bucket: ${bucket}`);

          // Set public read policy for images and thumbnails
          if (
            bucket === MINIO_CONFIG.BUCKETS.IMAGES ||
            bucket === MINIO_CONFIG.BUCKETS.THUMBNAILS
          ) {
            const policy = {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { AWS: ['*'] },
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${bucket}/*`],
                },
              ],
            };
            await this.minioClient.setBucketPolicy(
              bucket,
              JSON.stringify(policy),
            );
            console.log(`✅ Set public policy for bucket: ${bucket}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error with bucket ${bucket}:`, error.message);
      }
    }
  }

  // ✅ Use the exported interface for return type
  async uploadImageFromFile(
    filePath: string,
    folder: string = '',
    customName?: string,
  ): Promise<UploadResult> {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileBuffer = readFileSync(filePath);
    const fileName = customName || `${randomUUID()}.jpg`;
    const objectPath = folder ? `${folder}/${fileName}` : fileName;

    try {
      // Upload original image
      await this.minioClient.putObject(
        MINIO_CONFIG.BUCKETS.IMAGES,
        objectPath,
        fileBuffer,
        fileBuffer.length,
        {
          'Content-Type': 'image/jpeg',
        },
      );

      // Generate and upload thumbnail
      const thumbnailBuffer = await this.generateThumbnail(fileBuffer);
      await this.minioClient.putObject(
        MINIO_CONFIG.BUCKETS.THUMBNAILS,
        objectPath,
        thumbnailBuffer,
        thumbnailBuffer.length,
        {
          'Content-Type': 'image/jpeg',
        },
      );

      const baseUrl = this.getBaseUrl();

      return {
        originalUrl: `${baseUrl}/${MINIO_CONFIG.BUCKETS.IMAGES}/${objectPath}`,
        thumbnailUrl: `${baseUrl}/${MINIO_CONFIG.BUCKETS.THUMBNAILS}/${objectPath}`,
        filename: objectPath,
      };
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  }

  private async generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
      .resize(
        MINIO_CONFIG.THUMBNAIL_SIZE.WIDTH,
        MINIO_CONFIG.THUMBNAIL_SIZE.HEIGHT,
        { fit: 'cover', position: 'center' },
      )
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  private getBaseUrl(): string {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const protocol = useSSL ? 'https' : 'http';
    return `${protocol}://${endpoint}:${port}`;
  }
}
