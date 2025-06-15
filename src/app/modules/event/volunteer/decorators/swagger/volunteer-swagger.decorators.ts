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
import { CreateVolunteerApplicationDto } from '../../dto/create-volunteer-application.dto';
import { UpdateVolunteerApplicationDto } from '../../dto/update-volunteer-application.dto';

/**************************************
 * CONTROLLER DECORATOR
 **************************************/

export const VolunteerControllerSwagger = () =>
  applyDecorators(ApiTags('volunteer'), ApiBearerAuth());

/**************************************
 * APPLICATION OPERATIONS
 **************************************/

export const ApplyForEventSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Apply to be a volunteer for an event' }),
    ApiResponse({
      status: 201,
      description: 'The application has been created',
    }),
    ApiResponse({ status: 400, description: 'Invalid input data' }),
    ApiResponse({ status: 409, description: 'Already applied' }),
    ApiBody({ type: CreateVolunteerApplicationDto }),
  );

export const GetEventApplicationsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all volunteer applications for an event' }),
    ApiResponse({
      status: 200,
      description: 'Return all applications for the event',
    }),
    ApiResponse({ status: 403, description: 'Forbidden resource' }),
    ApiParam({ name: 'eventId', description: 'Event ID' }),
  );

export const GetMyApplicationsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all my volunteer applications' }),
    ApiResponse({
      status: 200,
      description: 'Return all applications for the current user',
    }),
  );

export const GetApplicationByIdSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get a volunteer application by ID' }),
    ApiResponse({ status: 200, description: 'Return the application' }),
    ApiResponse({ status: 404, description: 'Application not found' }),
    ApiParam({ name: 'id', description: 'Application ID' }),
  );

export const UpdateApplicationStatusSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update volunteer application status' }),
    ApiResponse({
      status: 200,
      description: 'The application status has been updated',
    }),
    ApiResponse({ status: 403, description: 'Forbidden resource' }),
    ApiResponse({ status: 404, description: 'Application not found' }),
    ApiParam({ name: 'id', description: 'Application ID' }),
    ApiBody({ type: UpdateVolunteerApplicationDto }),
  );

/**************************************
 * VOLUNTEER MANAGEMENT OPERATIONS
 **************************************/

export const GetEventVolunteersSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all volunteers for an event' }),
    ApiResponse({
      status: 200,
      description: 'Return all approved volunteers for the event',
    }),
    ApiParam({ name: 'eventId', description: 'Event ID' }),
  );

export const RemoveVolunteerSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Remove a volunteer from an event' }),
    ApiResponse({ status: 200, description: 'The volunteer has been removed' }),
    ApiResponse({ status: 403, description: 'Forbidden resource' }),
    ApiParam({ name: 'eventId', description: 'Event ID' }),
    ApiParam({ name: 'volunteerId', description: 'Volunteer ID' }),
  );

/**************************************
 * DASHBOARD OPERATIONS
 **************************************/

export const GetDashboardStatsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get volunteer dashboard statistics' }),
    ApiResponse({
      status: 200,
      description: 'Return dashboard statistics for the volunteer',
    }),
  );

/**************************************
 * VOLUNTEER HISTORY OPERATIONS
 **************************************/

export const GetVolunteerHistorySwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get volunteer history',
      description:
        'Get all events the current user has volunteered for, including past, current, and future events.',
    }),
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved volunteer history',
      schema: {
        example: {
          data: [
            {
              id: 'event-uuid-1',
              name: 'Tech Conference 2024',
              description: 'Annual technology conference',
              dateTime: '2024-03-15T09:00:00Z',
              locationDesc: 'Convention Center Downtown',
              status: 'COMPLETED',
              profileImage: 'https://example.com/event1.jpg',
              coverImage: 'https://example.com/cover1.jpg',
              volunteerStatus: 'APPROVED',
              approvedAt: '2024-01-15T10:30:00Z',
              category: {
                id: 'cat-uuid-1',
                name: 'Technology',
                image: 'https://example.com/tech.jpg',
              },
              organizer: {
                id: 'org-uuid-1',
                fullName: 'John Organizer',
                email: 'john@example.com',
              },
              _count: {
                attendingUsers: 150,
                volunteers: 20,
                tasks: 8,
              },
            },
            {
              id: 'event-uuid-2',
              name: 'Community Workshop 2025',
              description: 'Community building workshop',
              dateTime: '2025-06-20T14:00:00Z',
              locationDesc: 'Community Center',
              status: 'PUBLISHED',
              profileImage: 'https://example.com/event2.jpg',
              coverImage: 'https://example.com/cover2.jpg',
              volunteerStatus: 'APPROVED',
              approvedAt: '2025-01-10T15:45:00Z',
              category: {
                id: 'cat-uuid-2',
                name: 'Community',
                image: 'https://example.com/community.jpg',
              },
              organizer: {
                id: 'org-uuid-2',
                fullName: 'Jane Organizer',
                email: 'jane@example.com',
              },
              _count: {
                attendingUsers: 75,
                volunteers: 12,
                tasks: 5,
              },
            },
          ],
          meta: {
            total: 2,
            completed: 1,
            upcoming: 1,
            cancelled: 0,
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - user must be logged in',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      description: 'Filter by event status',
      enum: ['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED'],
      example: 'COMPLETED',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search by event name or description',
      example: 'conference',
    }),
  );
