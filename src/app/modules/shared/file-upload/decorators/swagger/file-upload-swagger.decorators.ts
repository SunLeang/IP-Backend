import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

/**************************************
 * CONTROLLER SWAGGER
 **************************************/

export const FileUploadControllerSwagger = () =>
  applyDecorators(ApiTags('file-upload'));

/**************************************
 * MINIO IMAGE UPLOAD OPERATIONS
 **************************************/

export const UploadImageToMinioSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Upload image to MinIO',
      description:
        'Upload an image file to MinIO storage with automatic thumbnail generation. Supports JPG, JPEG, PNG, GIF, and WebP formats up to 10MB.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Image file to upload',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Image file (JPG, JPEG, PNG, GIF, WebP)',
          },
        },
        required: ['file'],
      },
    }),
    ApiQuery({
      name: 'folder',
      required: false,
      description:
        'Folder to store the image (e.g., events, profiles, categories)',
      example: 'events',
    }),
    ApiResponse({
      status: 201,
      description: 'Image uploaded successfully',
      schema: {
        example: {
          success: true,
          message: 'Image uploaded successfully to MinIO',
          data: {
            originalUrl: 'http://localhost:9000/images/events/uuid-image.jpg',
            thumbnailUrl:
              'http://localhost:9000/thumbnails/events/uuid-image.jpg',
            filename: 'events/uuid-image.jpg',
            size: 2048576,
            mimetype: 'image/jpeg',
            uploadedBy: 'user-uuid',
            uploadedAt: '2025-06-20T10:30:00.000Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid file type or size',
      schema: {
        example: {
          statusCode: 400,
          message:
            'Invalid image type. Only JPG, JPEG, PNG, GIF, and WebP are allowed.',
          error: 'Bad Request',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token required',
    }),
    ApiBearerAuth(),
  );

export const DeleteImageFromMinioSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete image from MinIO',
      description: 'Delete an image and its thumbnail from MinIO storage.',
    }),
    ApiParam({
      name: 'filename',
      description: 'Filename of the image to delete (including folder path)',
      example: 'events/uuid-image.jpg',
    }),
    ApiResponse({
      status: 200,
      description: 'Image deleted successfully',
      schema: {
        example: {
          success: true,
          message: 'Image deleted successfully from MinIO',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token required',
    }),
    ApiBearerAuth(),
  );

/**************************************
 * MINIO DOCUMENT UPLOAD OPERATIONS
 **************************************/

export const UploadDocumentToMinioSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Upload document to MinIO',
      description:
        'Upload a document file to MinIO storage. Supports PDF, DOC, and DOCX formats up to 20MB.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Document file to upload',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Document file (PDF, DOC, DOCX)',
          },
        },
        required: ['file'],
      },
    }),
    ApiQuery({
      name: 'folder',
      required: false,
      description: 'Folder to store the document (e.g., cvs, certificates)',
      example: 'cvs',
    }),
    ApiResponse({
      status: 201,
      description: 'Document uploaded successfully',
      schema: {
        example: {
          success: true,
          message: 'Document uploaded successfully to MinIO',
          data: {
            documentUrl:
              'http://localhost:9000/documents/cvs/uuid-document.pdf',
            filename: 'cvs/uuid-document.pdf',
            originalName: 'resume.pdf',
            size: 1048576,
            mimetype: 'application/pdf',
            uploadedBy: 'user-uuid',
            uploadedAt: '2025-06-20T10:30:00.000Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid file type or size',
      schema: {
        example: {
          statusCode: 400,
          message:
            'Invalid document type. Only PDF, DOC, and DOCX are allowed.',
          error: 'Bad Request',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token required',
    }),
    ApiBearerAuth(),
  );

export const DeleteDocumentFromMinioSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete document from MinIO',
      description: 'Delete a document from MinIO storage.',
    }),
    ApiParam({
      name: 'filename',
      description: 'Filename of the document to delete (including folder path)',
      example: 'cvs/uuid-document.pdf',
    }),
    ApiResponse({
      status: 200,
      description: 'Document deleted successfully',
      schema: {
        example: {
          success: true,
          message: 'Document deleted successfully from MinIO',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token required',
    }),
    ApiBearerAuth(),
  );

/**************************************
 * LOCAL FILE UPLOAD OPERATIONS (LEGACY)
 **************************************/

export const UploadImageLocalSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Upload image locally (Legacy)',
      description:
        'Upload an image file to local storage. This is a legacy endpoint for backward compatibility.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Image file to upload',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Image file (JPG, JPEG, PNG, GIF)',
          },
        },
        required: ['file'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Image uploaded successfully to local storage',
      schema: {
        example: {
          filename: 'uuid-image.jpg',
          originalname: 'photo.jpg',
          path: '/uploads/images/uuid-image.jpg',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid file type or size',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token required',
    }),
    ApiBearerAuth(),
  );

export const UploadDocumentLocalSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Upload document locally (Legacy)',
      description:
        'Upload a document file to local storage. This is a legacy endpoint for backward compatibility.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Document file to upload',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Document file (PDF, DOC, DOCX)',
          },
        },
        required: ['file'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Document uploaded successfully to local storage',
      schema: {
        example: {
          filename: 'uuid-document.pdf',
          originalname: 'resume.pdf',
          path: '/uploads/documents/uuid-document.pdf',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid file type or size',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT token required',
    }),
    ApiBearerAuth(),
  );
