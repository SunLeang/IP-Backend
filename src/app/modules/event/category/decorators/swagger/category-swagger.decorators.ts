import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateCategoryDto } from '../../dto/create-category.dto';
import { UpdateCategoryDto } from '../../dto/update-category.dto';


/**************************************
 * CONTROLLER DECORATOR
 **************************************/

export const CategoryControllerSwagger = () =>
  applyDecorators(ApiTags('event-categories'), ApiBearerAuth());

/**************************************
 * CREATE OPERATIONS
 **************************************/

export const CreateCategorySwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new event category',
      description:
        'Create a new event category. Only admins and super admins can create categories.',
    }),
    ApiResponse({
      status: 201,
      description: 'The category has been created successfully',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Technology',
          image: 'https://example.com/tech-category.jpg',
          createdAt: '2025-01-01T12:00:00Z',
          updatedAt: '2025-01-01T12:00:00Z',
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - category with this name already exists',
      schema: {
        example: {
          statusCode: 409,
          message: "Category with name 'Technology' already exists",
          error: 'Conflict',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - only admins can create categories',
      schema: {
        example: {
          statusCode: 403,
          message: 'Insufficient permissions',
          error: 'Forbidden',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error',
      schema: {
        example: {
          statusCode: 400,
          message: ['name should not be empty'],
          error: 'Bad Request',
        },
      },
    }),
    ApiBody({ type: CreateCategoryDto }),
  );

/**************************************
 * READ OPERATIONS
 **************************************/

export const GetAllCategoriesSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all event categories',
      description:
        'Retrieve all event categories with event count. This endpoint is public.',
    }),
    ApiResponse({
      status: 200,
      description: 'Return all categories with event counts',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Technology',
            image: 'https://example.com/tech-category.jpg',
            createdAt: '2025-01-01T12:00:00Z',
            updatedAt: '2025-01-01T12:00:00Z',
            _count: {
              events: 15,
            },
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Business',
            image: 'https://example.com/business-category.jpg',
            createdAt: '2025-01-01T10:00:00Z',
            updatedAt: '2025-01-01T10:00:00Z',
            _count: {
              events: 8,
            },
          },
        ],
      },
    }),
  );

export const GetCategoryByIdSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get category by ID',
      description:
        'Retrieve a specific category with recent events. This endpoint is public.',
    }),
    ApiResponse({
      status: 200,
      description: 'Return the category with recent events',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Technology',
          image: 'https://example.com/tech-category.jpg',
          createdAt: '2025-01-01T12:00:00Z',
          updatedAt: '2025-01-01T12:00:00Z',
          events: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              name: 'Tech Conference 2025',
              dateTime: '2025-02-15T10:00:00Z',
              location: 'Convention Center',
              status: 'PUBLISHED',
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174003',
              name: 'AI Workshop',
              dateTime: '2025-02-20T14:00:00Z',
              location: 'Tech Hub',
              status: 'PUBLISHED',
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Category not found',
      schema: {
        example: {
          statusCode: 404,
          message:
            'Category with ID 123e4567-e89b-12d3-a456-426614174000 not found',
          error: 'Not Found',
        },
      },
    }),
    ApiParam({
      name: 'id',
      description: 'Category ID (UUID)',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );

/**************************************
 * UPDATE OPERATIONS
 **************************************/

export const UpdateCategorySwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update an event category',
      description:
        'Update an existing event category. Only admins and super admins can update categories.',
    }),
    ApiResponse({
      status: 200,
      description: 'The category has been updated successfully',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Technology & Innovation',
          image: 'https://example.com/updated-tech-category.jpg',
          createdAt: '2025-01-01T12:00:00Z',
          updatedAt: '2025-01-01T15:30:00Z',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Category not found',
      schema: {
        example: {
          statusCode: 404,
          message:
            'Category with ID 123e4567-e89b-12d3-a456-426614174000 not found',
          error: 'Not Found',
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - category name already exists',
      schema: {
        example: {
          statusCode: 409,
          message:
            "Category with name 'Technology & Innovation' already exists",
          error: 'Conflict',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - only admins can update categories',
      schema: {
        example: {
          statusCode: 403,
          message: 'Insufficient permissions',
          error: 'Forbidden',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error',
      schema: {
        example: {
          statusCode: 400,
          message: ['name should not be empty'],
          error: 'Bad Request',
        },
      },
    }),
    ApiParam({
      name: 'id',
      description: 'Category ID (UUID) to update',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({ type: UpdateCategoryDto }),
  );

/**************************************
 * DELETE OPERATIONS
 **************************************/

export const DeleteCategorySwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete an event category',
      description:
        'Delete an event category. Only admins and super admins can delete categories. Cannot delete categories with associated events.',
    }),
    ApiResponse({
      status: 200,
      description: 'The category has been deleted successfully',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Technology',
          image: 'https://example.com/tech-category.jpg',
          createdAt: '2025-01-01T12:00:00Z',
          updatedAt: '2025-01-01T12:00:00Z',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Category not found',
      schema: {
        example: {
          statusCode: 404,
          message:
            'Category with ID 123e4567-e89b-12d3-a456-426614174000 not found',
          error: 'Not Found',
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - cannot delete category with associated events',
      schema: {
        example: {
          statusCode: 409,
          message: 'Cannot delete category with 15 associated events',
          error: 'Conflict',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - only admins can delete categories',
      schema: {
        example: {
          statusCode: 403,
          message: 'Insufficient permissions',
          error: 'Forbidden',
        },
      },
    }),
    ApiParam({
      name: 'id',
      description: 'Category ID (UUID) to delete',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );
