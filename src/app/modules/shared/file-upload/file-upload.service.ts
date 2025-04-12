import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class FileUploadService {
  uploadFile(file: Express.Multer.File, folder: string = 'uploads'): { filePath: string; fileUrl: string } {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Ensure directory exists
    const uploadsDir = join(process.cwd(), 'public', folder);
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;
    const filePath = join(folder, uniqueFilename);
    const fileUrl = `/${filePath}`;
    
    // Return file path for saving to database
    return { filePath, fileUrl };
  }

  getFileUrl(filePath: string): string {
    if (!filePath) return '';
    return `/${filePath}`;
  }
}