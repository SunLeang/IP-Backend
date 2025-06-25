import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import * as sharp from 'sharp';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import {
  createMinioClient,
  MINIO_CONFIG,
} from '../../../core/config/minio.config';
import { getBoolean } from '../../../core/utils/type-conversion.utils';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly minioClient: MinioClient;

  constructor(private readonly configService: ConfigService) {
    this.minioClient = createMinioClient(configService);
  }

  async onModuleInit() {
    await this.ensureBucketsExist();
  }

  private async ensureBucketsExist() {
    const buckets = Object.values(MINIO_CONFIG.BUCKETS);

    for (const bucket of buckets) {
      try {
        const exists = await this.minioClient.bucketExists(bucket);
        if (!exists) {
          await this.minioClient.makeBucket(bucket);

          // Set bucket policy to public read for images and thumbnails
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
          }

          this.logger.log(`✅ Bucket '${bucket}' created successfully`);
        } else {
          this.logger.log(`📁 Bucket '${bucket}' already exists`);
        }
      } catch (error) {
        this.logger.error(`❌ Error with bucket '${bucket}':`, error.message);
      }
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = '',
  ): Promise<{ originalUrl: string; thumbnailUrl: string; filename: string }> {
    const filename = `${randomUUID()}${extname(file.originalname)}`;
    const objectPath = folder ? `${folder}/${filename}` : filename;

    try {
      // Upload original image
      await this.minioClient.putObject(
        MINIO_CONFIG.BUCKETS.IMAGES,
        objectPath,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'X-Amz-Meta-Original-Name': file.originalname,
        },
      );

      // Generate and upload thumbnail
      const thumbnailBuffer = await this.generateThumbnail(file.buffer);
      await this.minioClient.putObject(
        MINIO_CONFIG.BUCKETS.THUMBNAILS,
        objectPath,
        thumbnailBuffer,
        thumbnailBuffer.length,
        {
          'Content-Type': file.mimetype,
          'X-Amz-Meta-Original-Name': file.originalname,
        },
      );

      const baseUrl = this.getBaseUrl();

      return {
        originalUrl: `${baseUrl}/${MINIO_CONFIG.BUCKETS.IMAGES}/${objectPath}`,
        thumbnailUrl: `${baseUrl}/${MINIO_CONFIG.BUCKETS.THUMBNAILS}/${objectPath}`,
        filename: objectPath,
      };
    } catch (error) {
      this.logger.error('❌ Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  private async generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(
          MINIO_CONFIG.THUMBNAIL_SIZE.WIDTH,
          MINIO_CONFIG.THUMBNAIL_SIZE.HEIGHT,
          {
            fit: 'cover',
            position: 'center',
          },
        )
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error) {
      this.logger.error('❌ Error generating thumbnail:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  async deleteImage(filename: string): Promise<void> {
    try {
      await Promise.all([
        this.minioClient.removeObject(MINIO_CONFIG.BUCKETS.IMAGES, filename),
        this.minioClient.removeObject(
          MINIO_CONFIG.BUCKETS.THUMBNAILS,
          filename,
        ),
      ]);

      this.logger.log(`🗑️ Deleted image: ${filename}`);
    } catch (error) {
      this.logger.error(`❌ Error deleting image ${filename}:`, error);
    }
  }

  async uploadDocument(
    file: Express.Multer.File,
    folder: string = 'cvs',
  ): Promise<{ documentUrl: string; filename: string }> {
    const filename = `${randomUUID()}${extname(file.originalname)}`;
    const objectPath = folder ? `${folder}/${filename}` : filename;

    console.log('📤 MinIO uploadDocument called with:', {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      hasBuffer: !!file.buffer,
      bufferLength: file.buffer ? file.buffer.length : 'undefined',
      folder: folder,
      objectPath: objectPath,
    });

    // Validate file buffer exists
    if (!file.buffer) {
      this.logger.error('❌ File buffer is missing');
      throw new Error(
        'File buffer is missing - file may not have been properly uploaded',
      );
    }

    if (!Buffer.isBuffer(file.buffer)) {
      this.logger.error(
        '❌ File buffer is not a valid Buffer:',
        typeof file.buffer,
      );
      throw new Error('File buffer is not a valid Buffer type');
    }

    try {
      console.log('📤 Uploading to MinIO:', {
        bucket: MINIO_CONFIG.BUCKETS.DOCUMENTS,
        objectPath: objectPath,
        bufferLength: file.buffer.length,
        fileSize: file.size,
      });

      // Upload document to MinIO
      const result = await this.minioClient.putObject(
        MINIO_CONFIG.BUCKETS.DOCUMENTS,
        objectPath,
        file.buffer, // This should be a Buffer
        file.size,
        {
          'Content-Type': file.mimetype,
          'X-Amz-Meta-Original-Name': file.originalname,
          'X-Amz-Meta-Upload-Date': new Date().toISOString(),
        },
      );

      console.log('✅ MinIO upload result:', result);

      const baseUrl = this.getBaseUrl();
      const documentUrl = `${baseUrl}/${MINIO_CONFIG.BUCKETS.DOCUMENTS}/${objectPath}`;

      console.log('✅ Generated document URL:', documentUrl);

      return {
        documentUrl: documentUrl,
        filename: objectPath,
      };
    } catch (error) {
      this.logger.error('❌ Error uploading document:', error);
      console.error('❌ Detailed error:', {
        message: error.message,
        stack: error.stack,
        fileInfo: {
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          hasBuffer: !!file.buffer,
          bufferType: typeof file.buffer,
        },
      });
      throw new Error('Failed to upload document');
    }
  }

  async deleteDocument(filename: string): Promise<void> {
    try {
      await this.minioClient.removeObject(
        MINIO_CONFIG.BUCKETS.DOCUMENTS,
        filename,
      );
      this.logger.log(`🗑️ Deleted document: ${filename}`);
    } catch (error) {
      this.logger.error(`❌ Error deleting document ${filename}:`, error);
    }
  }

  private getBaseUrl(): string {
    const endpoint = this.configService.get<string>(
      'MINIO_ENDPOINT',
      'localhost',
    );
    const port = this.configService.get<string>('MINIO_PORT', '9000');
    const useSSL = getBoolean(this.configService.get('MINIO_USE_SSL'), false);
    const protocol = useSSL ? 'https' : 'http';

    return `${protocol}://${endpoint}:${port}`;
  }

  getClient(): MinioClient {
    return this.minioClient;
  }
}
