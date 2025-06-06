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
import { CreateInterestDto } from '../../dto/create-interest.dto';


/**************************************
 * CONTROLLER DECORATOR
 **************************************/

export const InterestControllerSwagger = () =>
  applyDecorators(
    ApiTags('interests'),
    ApiBearerAuth(),
  );

/**************************************
 * CREATE OPERATIONS
 **************************************/

export const AddInterestSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: "Add an event to user's interests" }),
    ApiResponse({
      status: 201,
      description: 'Event added to interests',
      schema: {
        example: {
          id: 'interest-id',
          userId: 'user-id',
          eventId: 'event-id',
          interestedAt: '2025-01-01T12:00:00Z',
          event: {
            id: 'event-id',
            name: 'Tech Conference 2025',
            description: 'Annual technology conference',
            dateTime: '2025-02-15T10:00:00Z',
            profileImage: 'https://example.com/event-image.jpg',
            status: 'PUBLISHED'
          }
        }
      }
    }),
    ApiResponse({ 
      status: 400, 
      description: 'Bad request - validation error',
      schema: {
        example: {
          statusCode: 400,
          message: ['eventId must be a UUID'],
          error: 'Bad Request'
        }
      }
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Event not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Event with ID eventId not found',
          error: 'Not Found'
        }
      }
    }),
    ApiResponse({ 
      status: 409, 
      description: 'Already interested in this event',
      schema: {
        example: {
          statusCode: 409,
          message: 'You are already interested in this event',
          error: 'Conflict'
        }
      }
    }),
    ApiBody({
      type: CreateInterestDto,
      description: 'Event interest data',
    }),
  );

/**************************************
 * DELETE OPERATIONS
 **************************************/

export const RemoveInterestSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: "Remove an event from user's interests" }),
    ApiResponse({
      status: 200,
      description: 'Event removed from interests',
      schema: {
        example: {
          id: 'interest-id',
          userId: 'user-id',
          eventId: 'event-id',
          interestedAt: '2025-01-01T12:00:00Z'
        }
      }
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Interest record not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Interest record not found',
          error: 'Not Found'
        }
      }
    }),
    ApiParam({ 
      name: 'eventId', 
      description: 'Event ID',
      example: '123e4567-e89b-12d3-a456-426614174000'
    }),
  );

/**************************************
 * READ OPERATIONS
 **************************************/

export const GetUserInterestsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all events user is interested in' }),
    ApiResponse({
      status: 200,
      description: 'Return list of interested events',
      schema: {
        example: {
          data: [
            {
              id: 'interest-id',
              userId: 'user-id',
              eventId: 'event-id',
              interestedAt: '2025-01-01T12:00:00Z',
              event: {
                id: 'event-id',
                name: 'Tech Conference 2025',
                description: 'Annual technology conference',
                dateTime: '2025-02-15T10:00:00Z',
                profileImage: 'https://example.com/event-image.jpg',
                locationDesc: 'Convention Center',
                status: 'PUBLISHED',
                category: {
                  id: 'category-id',
                  name: 'Technology'
                },
                organizer: {
                  id: 'organizer-id',
                  fullName: 'John Organizer'
                },
                _count: {
                  interestedUsers: 150,
                  attendingUsers: 85
                }
              }
            }
          ],
          meta: {
            total: 25,
            skip: 0,
            take: 10,
            hasMore: true
          }
        }
      }
    }),
    ApiQuery({
      name: 'skip',
      required: false,
      description: 'Pagination - records to skip',
      example: 0
    }),
    ApiQuery({
      name: 'take',
      required: false,
      description: 'Pagination - records to take',
      example: 10
    }),
  );

export const GetEventInterestedUsersSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all users interested in an event' }),
    ApiResponse({
      status: 200,
      description: 'Return list of interested users',
      schema: {
        example: {
          data: [
            {
              id: 'interest-id',
              userId: 'user-id',
              eventId: 'event-id',
              interestedAt: '2025-01-01T12:00:00Z',
              user: {
                id: 'user-id',
                fullName: 'John Doe',
                email: 'john@example.com',
                username: 'johndoe',
                gender: 'MALE',
                age: 28,
                org: 'Tech Corp',
                currentRole: 'Software Engineer'
              }
            }
          ],
          meta: {
            total: 150,
            skip: 0,
            take: 10,
            hasMore: true
          }
        }
      }
    }),
    ApiResponse({ 
      status: 403, 
      description: 'Forbidden - not authorized',
      schema: {
        example: {
          statusCode: 403,
          message: 'Only the event organizer or administrators can view interested users',
          error: 'Forbidden'
        }
      }
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Event not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Event with ID eventId not found',
          error: 'Not Found'
        }
      }
    }),
    ApiParam({ 
      name: 'eventId', 
      description: 'Event ID',
      example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    ApiQuery({
      name: 'skip',
      required: false,
      description: 'Pagination - records to skip',
      example: 0
    }),
    ApiQuery({
      name: 'take',
      required: false,
      description: 'Pagination - records to take',
      example: 10
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search users by name or email',
      example: 'john'
    }),
  );

export const CheckUserInterestSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Check if user is interested in an event' }),
    ApiResponse({
      status: 200,
      description: 'Return interest status',
      schema: {
        example: {
          interested: true
        }
      }
    }),
    ApiParam({ 
      name: 'eventId', 
      description: 'Event ID',
      example: '123e4567-e89b-12d3-a456-426614174000'
    }),
  );