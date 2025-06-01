import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { CurrentRole, SystemRole } from '@prisma/client';

/**************************************
 * CONTROLLER LEVEL DECORATORS
 **************************************/
export const UserControllerSwagger = () =>
  applyDecorators(ApiTags('User Management'));

/**************************************
 * GET ALL USERS ENDPOINT DECORATORS
 **************************************/
export const FindAllUsersSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all users',
      description: 'Retrieve a list of all users (Super Admin only)',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: 'Users retrieved successfully',
      schema: {
        example: [
          {
            id: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            email: 'john.doe@example.com',
            username: 'johndoe',
            fullName: 'John Doe',
            systemRole: 'USER',
            currentRole: 'ATTENDEE',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx2',
            email: 'admin@eventura.com',
            username: 'admin',
            fullName: 'Admin User',
            systemRole: 'ADMIN',
            currentRole: 'ATTENDEE',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      schema: {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Super Admin access required',
      schema: {
        example: {
          statusCode: 403,
          message: 'Forbidden resource',
          error: 'Forbidden',
        },
      },
    }),
  );

/**************************************
 * GET USER BY ID ENDPOINT DECORATORS
 **************************************/
export const FindOneUserSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get user by ID',
      description:
        'Retrieve a specific user by ID (own profile or admin access)',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'User ID',
      example: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    }),
    ApiResponse({
      status: 200,
      description: 'User retrieved successfully',
      schema: {
        example: {
          id: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          email: 'john.doe@example.com',
          username: 'johndoe',
          fullName: 'John Doe',
          systemRole: 'USER',
          currentRole: 'ATTENDEE',
          gender: 'Male',
          age: 25,
          org: 'ABC University',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Can only view own profile unless admin',
      schema: {
        example: {
          statusCode: 403,
          message: 'You can only view your own profile',
          error: 'Forbidden',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'User with ID clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx not found',
          error: 'Not Found',
        },
      },
    }),
  );

/**************************************
 * UPDATE USER ENDPOINT DECORATORS
 **************************************/
export const UpdateUserSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update user',
      description: 'Update user information (own profile or admin access)',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'User ID',
      example: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com',
            description: 'User email address',
          },
          username: {
            type: 'string',
            example: 'johndoe',
            description: 'Username',
          },
          fullName: {
            type: 'string',
            example: 'John Doe',
            description: 'Full name',
          },
          gender: {
            type: 'string',
            example: 'Male',
            description: 'Gender',
          },
          age: {
            type: 'number',
            example: 25,
            description: 'Age',
          },
          org: {
            type: 'string',
            example: 'ABC University',
            description: 'Organization',
          },
          systemRole: {
            type: 'string',
            enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
            example: 'USER',
            description: 'System role (Admin/Super Admin only)',
          },
          currentRole: {
            type: 'string',
            enum: ['ATTENDEE', 'VOLUNTEER'],
            example: 'ATTENDEE',
            description: 'Current active role',
          },
        },
      },
      examples: {
        basicUpdate: {
          summary: 'Basic Profile Update',
          description: 'Update basic profile information',
          value: {
            fullName: 'John Smith',
            age: 26,
            org: 'XYZ Corporation',
          },
        },
        adminRoleChange: {
          summary: 'Admin Role Change',
          description: 'Super admin changing user system role',
          value: {
            systemRole: 'ADMIN',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'User updated successfully',
      schema: {
        example: {
          id: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          email: 'john.doe@example.com',
          username: 'johndoe',
          fullName: 'John Smith',
          systemRole: 'USER',
          currentRole: 'ATTENDEE',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      schema: {
        example: {
          statusCode: 403,
          message: 'You can only update your own profile',
          error: 'Forbidden',
        },
      },
    }),
  );

/**************************************
 * DELETE USER ENDPOINT DECORATORS
 **************************************/
export const RemoveUserSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete user',
      description: 'Soft delete a user (Admin/Super Admin only)',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'User ID to delete',
      example: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    }),
    ApiResponse({
      status: 200,
      description: 'User deleted successfully',
      schema: {
        example: {
          id: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Admin cannot delete Super Admin',
      schema: {
        example: {
          statusCode: 403,
          message: 'Admin cannot delete a Super Admin account',
          error: 'Forbidden',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'User with ID clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx not found',
          error: 'Not Found',
        },
      },
    }),
  );

/**************************************
 * CHANGE SYSTEM ROLE ENDPOINT DECORATORS
 **************************************/
export const ChangeRoleSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Change user system role',
      description: 'Change user system role (Super Admin only)',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'User ID',
      example: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            enum: ['USER', 'ADMIN', 'SUPER_ADMIN'],
            example: 'ADMIN',
            description: 'New system role',
          },
        },
        required: ['role'],
      },
      examples: {
        promoteToAdmin: {
          summary: 'Promote to Admin',
          description: 'Promote user to admin role',
          value: {
            role: 'ADMIN',
          },
        },
        demoteToUser: {
          summary: 'Demote to User',
          description: 'Demote admin to regular user',
          value: {
            role: 'USER',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Role changed successfully',
      schema: {
        example: {
          id: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          systemRole: 'ADMIN',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
  );

/**************************************
 * CHANGE CURRENT ROLE ENDPOINT DECORATORS
 **************************************/
export const ChangeCurrentRoleSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Change user current role',
      description: 'Change user current role (Super Admin only)',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'id',
      description: 'User ID',
      example: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            enum: ['ATTENDEE', 'VOLUNTEER'],
            example: 'VOLUNTEER',
            description: 'New current role',
          },
        },
        required: ['role'],
      },
      examples: {
        switchToVolunteer: {
          summary: 'Switch to Volunteer',
          description: 'Force switch user to volunteer role',
          value: {
            role: 'VOLUNTEER',
          },
        },
        switchToAttendee: {
          summary: 'Switch to Attendee',
          description: 'Force switch user to attendee role',
          value: {
            role: 'ATTENDEE',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Current role changed successfully',
      schema: {
        example: {
          id: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          currentRole: 'VOLUNTEER',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
  );

/**************************************
 * SWITCH CURRENT ROLE (SELF) ENDPOINT DECORATORS
 **************************************/
export const SwitchCurrentRoleSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Switch own current role',
      description:
        'Switch your own current role between ATTENDEE and VOLUNTEER',
    }),
    ApiBearerAuth(),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            enum: ['ATTENDEE', 'VOLUNTEER'],
            example: 'VOLUNTEER',
            description: 'Role to switch to',
          },
        },
        required: ['role'],
      },
      examples: {
        becomeVolunteer: {
          summary: 'Become Volunteer',
          description:
            'Switch to volunteer role (requires approved application)',
          value: {
            role: 'VOLUNTEER',
          },
        },
        becomeAttendee: {
          summary: 'Become Attendee',
          description: 'Switch to attendee role',
          value: {
            role: 'ATTENDEE',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Role switched successfully',
      schema: {
        example: {
          id: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          currentRole: 'VOLUNTEER',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - No approved volunteer application',
      schema: {
        example: {
          statusCode: 403,
          message:
            'You must have an approved volunteer application to switch to volunteer role',
          error: 'Forbidden',
        },
      },
    }),
  );

/**************************************
 * SWITCH ROLE WITH TOKENS ENDPOINT DECORATORS
 **************************************/
export const SwitchRoleSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Switch role with new tokens',
      description: 'Switch current role and receive new access tokens',
    }),
    ApiBearerAuth(),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            enum: ['ATTENDEE', 'VOLUNTEER'],
            example: 'VOLUNTEER',
            description: 'Role to switch to',
          },
        },
        required: ['role'],
      },
      examples: {
        switchToVolunteer: {
          summary: 'Switch to Volunteer',
          description: 'Switch to volunteer role and get new tokens',
          value: {
            role: 'VOLUNTEER',
          },
        },
        switchToAttendee: {
          summary: 'Switch to Attendee',
          description: 'Switch to attendee role and get new tokens',
          value: {
            role: 'ATTENDEE',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Role switched successfully with new tokens',
      schema: {
        example: {
          user: {
            id: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            email: 'john.doe@example.com',
            fullName: 'John Doe',
            currentRole: 'VOLUNTEER',
            systemRole: 'USER',
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - No approved volunteer application',
      schema: {
        example: {
          statusCode: 403,
          message:
            'You must have an approved volunteer application to switch to volunteer role',
          error: 'Forbidden',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid role',
      schema: {
        example: {
          statusCode: 400,
          message: 'Invalid role',
          error: 'Bad Request',
        },
      },
    }),
  );

/**************************************
 * ROLE REDIRECT ENDPOINTS DECORATORS
 **************************************/
export const SwitchRoleRedirectSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Switch role with redirect',
      description:
        'Switch role and redirect to specified URL (used for frontend integration)',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            enum: ['ATTENDEE', 'VOLUNTEER'],
            example: 'VOLUNTEER',
          },
          redirectUrl: {
            type: 'string',
            example: 'http://localhost:3000/volunteer-dashboard',
            description: 'URL to redirect to after role switch',
          },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description: 'Access token for authentication',
          },
        },
        required: ['role', 'redirectUrl', 'token'],
      },
    }),
    ApiResponse({
      status: 302,
      description: 'Redirect to specified URL after successful role switch',
    }),
    ApiResponse({
      status: 302,
      description: 'Redirect to login on error',
    }),
  );

export const SwitchRoleDirectSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Switch role direct redirect',
      description: 'Switch role and redirect directly (simplified version)',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            enum: ['ATTENDEE', 'VOLUNTEER'],
            example: 'VOLUNTEER',
          },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description: 'Access token for authentication',
          },
          redirectUrl: {
            type: 'string',
            example: 'http://localhost:3000/dashboard',
            description: 'Optional redirect URL',
          },
        },
        required: ['role', 'token'],
      },
    }),
    ApiResponse({
      status: 302,
      description: 'Redirect after successful role switch',
    }),
    ApiResponse({
      status: 302,
      description: 'Redirect to login on error',
    }),
  );

/**************************************
 * COMMON RESPONSE DECORATORS
 **************************************/
export const UnauthorizedResponse = () =>
  applyDecorators(
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      schema: {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        },
      },
    }),
  );

export const ForbiddenResponse = () =>
  applyDecorators(
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      schema: {
        example: {
          statusCode: 403,
          message: 'Forbidden resource',
          error: 'Forbidden',
        },
      },
    }),
  );

export const NotFoundResponse = () =>
  applyDecorators(
    ApiResponse({
      status: 404,
      description: 'Resource not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Resource not found',
          error: 'Not Found',
        },
      },
    }),
  );

export const ValidationErrorResponse = () =>
  applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Validation error',
      schema: {
        example: {
          statusCode: 400,
          message: ['Validation error messages'],
          error: 'Bad Request',
        },
      },
    }),
  );

export const InternalServerErrorResponse = () =>
  applyDecorators(
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        example: {
          statusCode: 500,
          message: 'Internal server error',
          error: 'Internal Server Error',
        },
      },
    }),
  );
