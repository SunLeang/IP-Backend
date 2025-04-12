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
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  import { extname, join } from 'path';
  import { randomUUID } from 'crypto';
  import { FileUploadService } from './file-upload.service';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
  
  @ApiTags('file-upload')
  @Controller('file-upload')
  export class FileUploadController {
    constructor(private readonly fileUploadService: FileUploadService) {}
  
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
            return cb(new BadRequestException('Only image files are allowed!'), false);
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
            const uploadPath = join(process.cwd(), 'public', 'uploads', 'documents');
            cb(null, uploadPath);
          },
          filename: (req, file, cb) => {
            const uniqueFilename = `${randomUUID()}${extname(file.originalname)}`;
            cb(null, uniqueFilename);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
            return cb(new BadRequestException('Only PDF and Word documents are allowed!'), false);
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
            new FileTypeValidator({ fileType: '.(pdf|doc|docx)' }),
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