import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { getBoolean, getNumber } from '../utils/type-conversion.utils';

export const createMinioClient = (configService: ConfigService): Client => {
  const config = {
    endPoint: configService.get<string>('MINIO_ENDPOINT', 'localhost'),
    port: getNumber(configService.get('MINIO_PORT'), 9000),
    useSSL: getBoolean(configService.get('MINIO_USE_SSL'), false),
    accessKey: configService.get<string>('MINIO_ACCESS_KEY', 'eventura'),
    secretKey: configService.get<string>(
      'MINIO_SECRET_KEY',
      'eventura_password',
    ),
  };

  console.log('MinIO Client Configuration:', {
    endPoint: config.endPoint,
    port: config.port,
    useSSL: config.useSSL,
    accessKey: config.accessKey,
    // Don't log secret in production
  });

  return new Client(config);
};

export const MINIO_CONFIG = {
  BUCKETS: {
    IMAGES: 'images',
    THUMBNAILS: 'thumbnails',
    DOCUMENTS: 'documents',
  },
  THUMBNAIL_SIZE: {
    WIDTH: 300,
    HEIGHT: 200,
  },
  MAX_FILE_SIZE: {
    IMAGE: 10 * 1024 * 1024, // 10MB
    DOCUMENT: 20 * 1024 * 1024, // 20MB
  },
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ALLOWED_DOCUMENT_EXTENSIONS: ['.pdf', '.doc', '.docx'],
};
