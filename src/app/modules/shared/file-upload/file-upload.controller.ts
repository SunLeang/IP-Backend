import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { FileUploadService } from './file-upload.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GetUser } from 'src/app/core/decorators/get-user.decorator';
import { CustomFileTypeValidator } from 'src/app/core/validators/custom-file-type.validator';

@ApiTags('file-upload')
@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  // NEW MINIO ENDPOINT FOR IMAGES
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    description:
      'Folder to store the image (e.g., events, profiles, categories)',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('minio/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // ✅ Now correctly imported from multer
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadImageToMinio(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|gif|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('folder') folder?: string,
    @GetUser('id') userId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const uploadFolder = folder || 'general';
    const result = await this.fileUploadService.uploadImage(file, uploadFolder);

    return {
      success: true,
      message: 'Image uploaded successfully to MinIO',
      data: {
        originalUrl: result.originalUrl,
        thumbnailUrl: result.thumbnailUrl,
        filename: result.filename,
        size: result.size,
        mimetype: result.mimetype,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('minio/image/:filename')
  async deleteImageFromMinio(@Param('filename') filename: string) {
    await this.fileUploadService.deleteImage(filename);
    return {
      success: true,
      message: 'Image deleted successfully from MinIO',
    };
  }

  // FIXED DOCUMENT UPLOAD ENDPOINT WITH MEMORY STORAGE
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Folder to store the document (e.g., cvs, certificates)',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('minio/document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // ✅ Now correctly imported from multer
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
      fileFilter: (req, file, cb) => {
        // Optional: Additional server-side validation
        console.log('🔍 Server-side file filter:', {
          originalname: file.originalname,
          mimetype: file.mimetype,
        });

        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Invalid file type'), false);
        }

        cb(null, true);
      },
    }),
  )
  async uploadDocumentToMinio(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }), // 20MB
          new CustomFileTypeValidator(
            ['.pdf', '.doc', '.docx'],
            [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
          ),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('folder') folder?: string,
    @GetUser('id') userId?: string,
  ) {
    console.log('📤 Document upload controller received:', {
      fileName: file?.originalname,
      fileSize: file?.size,
      mimeType: file?.mimetype,
      hasBuffer: !!file?.buffer,
      bufferLength: file?.buffer ? file.buffer.length : 'undefined',
      bufferType: file?.buffer ? typeof file.buffer : 'undefined',
      folder: folder,
      userId: userId,
    });

    if (!file) {
      console.error('❌ No file uploaded');
      throw new BadRequestException('No file uploaded');
    }

    if (!file.buffer) {
      console.error('❌ File buffer is missing');
      throw new BadRequestException(
        'File buffer is missing - please try uploading again',
      );
    }

    const uploadFolder = folder || 'cvs';
    console.log(`📁 Uploading to folder: ${uploadFolder}`);

    try {
      const result = await this.fileUploadService.uploadDocument(
        file,
        uploadFolder,
      );
      console.log('✅ Upload successful:', result);

      return {
        success: true,
        message: 'Document uploaded successfully to MinIO',
        data: {
          documentUrl: result.documentUrl,
          filename: result.filename,
          originalName: file.originalname,
          size: result.size,
          mimetype: result.mimetype,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw new BadRequestException(error.message || 'Upload failed');
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('minio/document/:filename')
  async deleteDocumentFromMinio(@Param('filename') filename: string) {
    await this.fileUploadService.deleteDocument(filename);
    return {
      success: true,
      message: 'Document deleted successfully from MinIO',
    };
  }

  // EXISTING LOCAL FILE ENDPOINTS (keep for backward compatibility)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'public', 'uploads', 'images');
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueFilename = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueFilename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|gif)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return {
      filename: file.filename,
      originalname: file.originalname,
      path: `/uploads/images/${file.filename}`,
    };
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(
            process.cwd(),
            'public',
            'uploads',
            'documents',
          );
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueFilename = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueFilename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
          return cb(
            new BadRequestException('Only PDF and Word documents are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /\.(pdf|doc|docx)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return {
      filename: file.filename,
      originalname: file.originalname,
      path: `/uploads/documents/${file.filename}`,
    };
  }
}
