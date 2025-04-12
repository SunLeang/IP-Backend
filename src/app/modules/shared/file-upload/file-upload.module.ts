import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: () => {
        const uploadPath = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        
        // Create subdirectories
        const imagesPath = join(uploadPath, 'images');
        if (!existsSync(imagesPath)) {
          mkdirSync(imagesPath, { recursive: true });
        }
        
        const documentsPath = join(uploadPath, 'documents');
        if (!existsSync(documentsPath)) {
          mkdirSync(documentsPath, { recursive: true });
        }
        
        return {
          dest: uploadPath,
        };
      },
    }),
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}