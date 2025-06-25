import { Injectable, BadRequestException } from '@nestjs/common';
import { MinioService } from '../minio/minio.service';
import { randomUUID } from 'crypto';

@Injectable()
export class FileUploadService {
  constructor(private readonly minioService: MinioService) {}

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<{
    originalUrl: string;
    thumbnailUrl: string;
    filename: string;
    size: number;
    mimetype: string;
  }> {
    if (!this.isValidImageType(file.mimetype)) {
      throw new BadRequestException(
        'Invalid image type. Only JPG, JPEG, PNG, GIF, and WebP are allowed.',
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      throw new BadRequestException(
        'File size too large. Maximum 10MB allowed.',
      );
    }

    const result = await this.minioService.uploadImage(file, folder);

    return {
      ...result,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async deleteImage(filename: string): Promise<void> {
    await this.minioService.deleteImage(filename);
  }

  private isValidImageType(mimetype: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    return allowedTypes.includes(mimetype);
  }

  // Keep existing local file methods for backward compatibility
  uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): { filePath: string; fileUrl: string } {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;
    const filePath = `${folder}/${uniqueFilename}`;
    const fileUrl = `/${filePath}`;

    return { filePath, fileUrl };
  }

  getFileUrl(filePath: string): string {
    if (!filePath) return '';
    return `/${filePath}`;
  }

  async uploadDocument(
    file: Express.Multer.File,
    folder: string = 'cvs',
  ): Promise<{
    documentUrl: string;
    filename: string;
    size: number;
    mimetype: string;
  }> {
    if (!this.isValidDocumentType(file.mimetype)) {
      throw new BadRequestException(
        'Invalid document type. Only PDF, DOC, and DOCX are allowed.',
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      // 20MB limit
      throw new BadRequestException(
        'File size too large. Maximum 20MB allowed.',
      );
    }

    const result = await this.minioService.uploadDocument(file, folder);

    return {
      ...result,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async deleteDocument(filename: string): Promise<void> {
    await this.minioService.deleteDocument(filename);
  }

  private isValidDocumentType(mimetype: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    return allowedTypes.includes(mimetype);
  }
}
