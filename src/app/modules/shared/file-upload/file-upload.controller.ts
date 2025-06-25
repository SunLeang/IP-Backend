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
import { GetUser } from 'src/app/core/decorators/get-user.decorator';
import { CustomFileTypeValidator } from 'src/app/core/validators/custom-file-type.validator';

// Import Swagger decorators
import {
  FileUploadControllerSwagger,
  UploadImageToMinioSwagger,
  DeleteImageFromMinioSwagger,
  UploadDocumentToMinioSwagger,
  DeleteDocumentFromMinioSwagger,
  UploadImageLocalSwagger,
  UploadDocumentLocalSwagger,
} from './decorators/swagger';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/

@FileUploadControllerSwagger()
@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  /**************************************
   * MINIO IMAGE OPERATIONS
   **************************************/

  @UploadImageToMinioSwagger()
  @UseGuards(JwtAuthGuard)
  @Post('minio/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadImageToMinio(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
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

  @DeleteImageFromMinioSwagger()
  @UseGuards(JwtAuthGuard)
  @Delete('minio/image/:filename')
  async deleteImageFromMinio(@Param('filename') filename: string) {
    await this.fileUploadService.deleteImage(filename);
    return {
      success: true,
      message: 'Image deleted successfully from MinIO',
    };
  }

  /**************************************
   * MINIO DOCUMENT OPERATIONS
   **************************************/

  @UploadDocumentToMinioSwagger()
  @UseGuards(JwtAuthGuard)
  @Post('minio/document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (req, file, cb) => {
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
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),
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
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded or file buffer missing');
    }

    const uploadFolder = folder || 'cvs';

    try {
      const result = await this.fileUploadService.uploadDocument(
        file,
        uploadFolder,
      );

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
      throw new BadRequestException(error.message || 'Upload failed');
    }
  }

  @DeleteDocumentFromMinioSwagger()
  @UseGuards(JwtAuthGuard)
  @Delete('minio/document/:filename')
  async deleteDocumentFromMinio(@Param('filename') filename: string) {
    await this.fileUploadService.deleteDocument(filename);
    return {
      success: true,
      message: 'Document deleted successfully from MinIO',
    };
  }

  /**************************************
   * LOCAL FILE OPERATIONS (LEGACY)
   **************************************/

  @UploadImageLocalSwagger()
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
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

  @UploadDocumentLocalSwagger()
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
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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
