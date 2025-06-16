import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateAttendanceDto } from '../../dto/create-attendance.dto';
import { UpdateAttendanceDto } from '../../dto/update-attendance.dto';


/**************************************
 * CONTROLLER DECORATOR
 **************************************/

export const AttendanceControllerSwagger = () =>
  applyDecorators(ApiTags('attendance'), ApiBearerAuth());

/**************************************
 * REGISTRATION OPERATIONS
 **************************************/

export const RegisterAttendeeSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Register a new attendee for an event' }),
    ApiResponse({
      status: 201,
      description: 'The attendee has been registered',
      schema: {
        example: {
          id: 'attendance-id',
          userId: 'user-id',
          eventId: 'event-id',
          status: 'JOINED',
          createdAt: '2025-01-01T12:00:00Z',
          user: {
            id: 'user-id',
            fullName: 'John Doe',
            email: 'john@example.com',
          },
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiResponse({ status: 404, description: 'Event or user not found' }),
    ApiBody({ type: CreateAttendanceDto }),
  );

/**************************************
 * QUERY OPERATIONS
 **************************************/

export const GetEventAttendeesSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all attendees for an event' }),
    ApiResponse({
      status: 200,
      description: 'Return the list of attendees',
      schema: {
        example: {
          data: [
            {
              userId: 'user-id',
              eventId: 'event-id',
              status: 'JOINED',
              checkedInAt: '2025-01-01T12:00:00Z',
              user: {
                id: 'user-id',
                fullName: 'John Doe',
                email: 'john@example.com',
              },
            },
          ],
          meta: {
            total: 50,
            skip: 0,
            take: 20,
            hasMore: true,
          },
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiParam({
      name: 'eventId',
      description: 'Event ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      description: 'Filter by attendance status',
      enum: ['JOINED', 'LEFT_EARLY', 'NO_SHOW'],
      example: 'JOINED',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search by attendee name or email',
      example: 'john',
    }),
    ApiQuery({
      name: 'skip',
      required: false,
      description: 'Pagination - records to skip',
      example: 0,
    }),
    ApiQuery({
      name: 'take',
      required: false,
      description: 'Pagination - records to take (max 1000)',
      example: 20,
    }),
  );

export const GetAttendanceByCompositeIdSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get attendance details by user ID and event ID' }),
    ApiResponse({
      status: 200,
      description: 'Return the attendance details',
      schema: {
        example: {
          userId: 'user-id',
          eventId: 'event-id',
          status: 'JOINED',
          checkedInAt: '2025-01-01T12:00:00Z',
          notes: 'On time arrival',
          user: {
            id: 'user-id',
            fullName: 'John Doe',
            email: 'john@example.com',
          },
          event: {
            id: 'event-id',
            name: 'Tech Conference 2025',
            dateTime: '2025-01-01T10:00:00Z',
          },
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Attendance record not found' }),
    ApiParam({
      name: 'userId',
      description: 'User ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'eventId',
      description: 'Event ID',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
  );

export const GetAttendanceByIdSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get attendance details by composite ID' }),
    ApiResponse({
      status: 200,
      description: 'Return the attendance details',
      schema: {
        example: {
          userId: 'user-id',
          eventId: 'event-id',
          status: 'JOINED',
          checkedInAt: '2025-01-01T12:00:00Z',
          user: {
            fullName: 'John Doe',
            email: 'john@example.com',
          },
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Attendance record not found' }),
    ApiParam({
      name: 'id',
      description: 'Composite attendance ID (format: userId:eventId)',
      example: 'userId:eventId',
    }),
  );

/**************************************
 * STATISTICS OPERATIONS
 **************************************/

export const GetEventAttendanceStatsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get attendance statistics for an event' }),
    ApiResponse({
      status: 200,
      description: 'Return attendance statistics',
      schema: {
        example: {
          total: 100,
          joined: 85,
          leftEarly: 10,
          noShow: 5,
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiParam({
      name: 'eventId',
      description: 'Event ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );

/**************************************
 * UPDATE OPERATIONS
 **************************************/

export const UpdateAttendanceByCompositeIdSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update attendance details by user ID and event ID',
    }),
    ApiResponse({
      status: 200,
      description: 'The attendance has been updated',
      schema: {
        example: {
          userId: 'user-id',
          eventId: 'event-id',
          status: 'JOINED',
          checkedInAt: '2025-01-01T12:00:00Z',
          updatedBy: 'organizer-id',
          notes: 'Checked in successfully',
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Attendance record not found' }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiParam({
      name: 'userId',
      description: 'User ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'eventId',
      description: 'Event ID',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiBody({ type: UpdateAttendanceDto }),
  );

export const UpdateAttendanceByIdSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update attendance details (check-in, etc.)' }),
    ApiResponse({
      status: 200,
      description: 'The attendance has been updated',
      schema: {
        example: {
          userId: 'user-id',
          eventId: 'event-id',
          status: 'LEFT_EARLY',
          checkedOutAt: '2025-01-01T15:30:00Z',
          notes: 'Left due to emergency',
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Attendance record not found' }),
    ApiResponse({ status: 400, description: 'Bad request - validation error' }),
    ApiParam({
      name: 'id',
      description: 'Composite attendance ID (format: userId:eventId)',
      example: 'userId:eventId',
    }),
    ApiBody({ type: UpdateAttendanceDto }),
  );

/**************************************
 * DELETE OPERATIONS
 **************************************/

export const DeleteAttendanceByCompositeIdSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Remove an attendance record by user ID and event ID',
    }),
    ApiResponse({
      status: 200,
      description: 'The attendance has been deleted',
      schema: {
        example: {
          message: 'Attendance record deleted successfully',
          userId: 'user-id',
          eventId: 'event-id',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - only organizers & admins can delete',
    }),
    ApiResponse({ status: 404, description: 'Attendance record not found' }),
    ApiParam({
      name: 'userId',
      description: 'User ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiParam({
      name: 'eventId',
      description: 'Event ID',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
  );

export const DeleteAttendanceByIdSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Remove an attendance record' }),
    ApiResponse({
      status: 200,
      description: 'The attendance has been deleted',
      schema: {
        example: {
          message: 'Attendance record deleted successfully',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - only organizers & admins can delete',
    }),
    ApiResponse({ status: 404, description: 'Attendance record not found' }),
    ApiParam({
      name: 'id',
      description: 'Composite attendance ID (format: userId:eventId)',
      example: 'userId:eventId',
    }),
  );

/**************************************
 * BULK OPERATIONS
 **************************************/

export const BulkCheckInSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Bulk check-in multiple attendees' }),
    ApiResponse({
      status: 201,
      description: 'Attendees have been checked in',
      schema: {
        example: {
          eventId: 'event-id',
          successCount: 8,
          failedCount: 2,
          results: [
            {
              success: true,
              userId: 'user-id-1',
              attendanceId: 'user-id-1:event-id',
              userName: 'John Doe',
            },
            {
              success: false,
              userId: 'user-id-2',
              error: 'User not found',
            },
          ],
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiResponse({ status: 400, description: 'Bad request - invalid user IDs' }),
    ApiParam({
      name: 'eventId',
      description: 'Event ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          userIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of User IDs to check in (max 100)',
            example: [
              '123e4567-e89b-12d3-a456-426614174000',
              '123e4567-e89b-12d3-a456-426614174001',
              '123e4567-e89b-12d3-a456-426614174002',
            ],
            minItems: 1,
            maxItems: 100,
          },
        },
        required: ['userIds'],
      },
    }),
  );

export const CheckAttendanceStatusSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Check if user has attended an event',
      description:
        'Check the attendance status of the current user for a specific event. Returns whether they attended and their attendance details.',
    }),
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved attendance status',
      schema: {
        example: {
          hasAttended: true,
          attendanceStatus: 'JOINED',
          checkedInAt: '2025-01-15T09:30:00Z',
          eventStatus: 'COMPLETED',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'User has not attended (example response)',
      schema: {
        example: {
          hasAttended: false,
          attendanceStatus: 'NOT_REGISTERED',
          eventStatus: 'PUBLISHED',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - user must be logged in',
    }),
    ApiResponse({
      status: 404,
      description: 'Event not found',
      schema: {
        example: {
          hasAttended: false,
          eventStatus: 'NOT_FOUND',
        },
      },
    }),
    ApiParam({
      name: 'eventId',
      description: 'Event ID to check attendance for',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );
