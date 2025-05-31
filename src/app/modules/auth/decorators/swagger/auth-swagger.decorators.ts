import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterDto } from '../../dto/register.dto';
import { LoginDto } from '../../dto/login.dto';
import { RefreshTokenDto } from '../../dto/refresh-token.dto';

/**************************************
 * CONTROLLER LEVEL DECORATORS
 **************************************/
export const AuthControllerSwagger = () =>
  applyDecorators(ApiTags('Authentication'));

/**************************************
 * REGISTER ENDPOINT DECORATORS
 **************************************/
export const RegisterSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Register a new user',
      description:
        'Create a new user account with email, password, and profile information',
    }),
    ApiBody({
      type: RegisterDto,
      examples: {
        attendee: {
          summary: 'Register as Attendee',
          description: 'Register a new user with attendee role',
          value: {
            email: 'john.doe@example.com',
            password: 'securePassword123',
          },
        },
        admin: {
          summary: 'Register as admin',
          description: 'Register a new user with admin intentions',
          value: {
            email: 'makara.chiv@example.com',
            password: 'strongPassword456',
          },
        },
        super_admin: {
          summary: 'Register as Super Admin',
          description: 'Register a new user with Super Admin intentions',
          value: {
            username: 'sokha',
            email: 'sokha.song@example.com',
            password: 'strongPassword456',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'User successfully registered',
      schema: {
        example: {
          user: {
            id: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            email: 'john.doe@example.com',
            username: 'johndoe',
            fullName: 'John Doe',
            systemRole: 'USER',
            currentRole: 'ATTENDEE',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Email or username already exists',
      schema: {
        example: {
          statusCode: 409,
          message: 'Email already in use',
          error: 'Conflict',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      schema: {
        example: {
          statusCode: 400,
          message: [
            'email must be an email',
            'password must be longer than or equal to 8 characters',
          ],
          error: 'Bad Request',
        },
      },
    }),
  );

/**************************************
 * LOGIN ENDPOINT DECORATORS
 **************************************/
export const LoginSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'User login',
      description: 'Authenticate user and return access and refresh tokens',
    }),
    ApiBody({
      type: LoginDto,
      examples: {
        user: {
          summary: 'User Login',
          description: 'Login with email and password',
          value: {
            email: 'john.doe@example.com',
            password: 'securePassword123',
          },
        },
        admin: {
          summary: 'Admin Login',
          description: 'Login as an administrator',
          value: {
            email: 'admin@eventura.com',
            password: 'adminPassword123',
          },
        },
        superAdmin: {
          summary: 'Super Admin Login',
          description: 'Login as a super administrator',
          value: {
            username: 'sokha',
            email: 'superadmin@eventura.com',
            password: 'superAdminPassword123',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
      schema: {
        example: {
          user: {
            id: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
            email: 'john.doe@example.com',
            fullName: 'John Doe',
            systemRole: 'USER',
            currentRole: 'ATTENDEE',
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid credentials',
      schema: {
        example: {
          statusCode: 401,
          message: 'Invalid credentials',
          error: 'Unauthorized',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Validation error',
      schema: {
        example: {
          statusCode: 400,
          message: ['email must be an email', 'password should not be empty'],
          error: 'Bad Request',
        },
      },
    }),
  );

/**************************************
 * LOGOUT ENDPOINT DECORATORS
 **************************************/
export const LogoutSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'User logout',
      description: 'Revoke refresh token and logout user',
    }),
    ApiBearerAuth(),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          refreshToken: {
            type: 'string',
            description: 'The refresh token to revoke',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
        required: ['refreshToken'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Logout successful',
      schema: {
        example: {
          success: true,
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid token',
      schema: {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        },
      },
    }),
  );

/**************************************
 * REFRESH TOKEN ENDPOINT DECORATORS
 **************************************/
export const RefreshTokenSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Refresh access token',
      description:
        'Generate new access and refresh tokens using a valid refresh token',
    }),
    ApiBody({
      type: RefreshTokenDto,
      examples: {
        refreshToken: {
          summary: 'Refresh Token Request',
          description: 'Send refresh token to get new tokens',
          value: {
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHh4eHh4LXh4eHgtNHh4eC14eHh4LXh4eHh4eHh4eHh4eCIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDk1NjQ0MjcsImV4cCI6MTcxMDE2OTIyN30...'
          }
        }
      }
    }),
    ApiResponse({
      status: 200,
      description: 'Tokens refreshed successfully',
      schema: {
        example: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid or expired refresh token',
      schema: {
        example: {
          statusCode: 401,
          message: 'Invalid or expired refresh token',
          error: 'Unauthorized',
        },
      },
    }),
  );


/**************************************
 * PROFILE ENDPOINT DECORATORS
 **************************************/
export const GetProfileSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get user profile',
      description: 'Retrieve current authenticated user profile information',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: 'User profile retrieved successfully',
      schema: {
        example: {
          id: 'clxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          email: 'john.doe@example.com',
          username: 'johndoe',
          fullName: 'John Doe',
          systemRole: 'USER',
          currentRole: 'ATTENDEE',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid token',
      schema: {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        },
      },
    }),
  );

/**************************************
 * ADMIN ENDPOINT DECORATORS
 **************************************/
export const AdminRouteSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Admin access test',
      description: 'Test endpoint for admin role verification',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: 'Admin access granted',
      schema: {
        example: {
          message: 'This is an admin route',
        },
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

/**************************************
 * SUPER ADMIN ENDPOINT DECORATORS
 **************************************/
export const SuperAdminRouteSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Super admin access test',
      description: 'Test endpoint for super admin role verification',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: 'Super admin access granted',
      schema: {
        example: {
          message: 'This is a super admin route',
        },
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
