import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateAnnouncementDto } from '../../dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../../dto/update-announcement.dto';


/**************************************
 * CONTROLLER DECORATOR
 **************************************/

export const AnnouncementControllerSwagger = () =>
  applyDecorators(ApiTags('announcements'), ApiBearerAuth());

/**************************************
 * CREATE OPERATIONS
 **************************************/

export const CreateAnnouncementSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a new announcement' }),
    ApiResponse({
      status: 201,
      description: 'The announcement has been created',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          eventId: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Important Update',
          description: "Please note the venue change for tomorrow's event",
          image: 'https://example.com/announcement-image.jpg',
          createdAt: '2025-01-01T12:00:00Z',
          updatedAt: '2025-01-01T12:00:00Z',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description:
        'Forbidden - only event organizers and admins can create announcements',
      schema: {
        example: {
          statusCode: 403,
          message: 'Only event organizers or admins can create announcements',
          error: 'Forbidden',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Event not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Event with ID eventId not found',
          error: 'Not Found',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error',
      schema: {
        example: {
          statusCode: 400,
          message: [
            'title should not be empty',
            'description should not be empty',
          ],
          error: 'Bad Request',
        },
      },
    }),
    ApiBody({ type: CreateAnnouncementDto }),
  );

/**************************************
 * READ OPERATIONS
 **************************************/

export const GetEventAnnouncementsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all announcements for an event' }),
    ApiResponse({
      status: 200,
      description: 'Return all announcements for the event',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            eventId: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Event Reminder',
            description: "Don't forget to bring your ID card",
            image: null,
            createdAt: '2025-01-01T12:00:00Z',
            updatedAt: '2025-01-01T12:00:00Z',
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            eventId: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Venue Change',
            description: 'The venue has been changed to Main Hall',
            image: 'https://example.com/venue-image.jpg',
            createdAt: '2025-01-01T10:00:00Z',
            updatedAt: '2025-01-01T10:00:00Z',
          },
        ],
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Event not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Event with ID eventId not found',
          error: 'Not Found',
        },
      },
    }),
    ApiParam({
      name: 'eventId',
      description: 'Event ID to get announcements for',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );

export const GetAnnouncementByIdSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get announcement by ID' }),
    ApiResponse({
      status: 200,
      description: 'Return the announcement with event details',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          eventId: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Important Update',
          description: "Please note the venue change for tomorrow's event",
          image: 'https://example.com/announcement-image.jpg',
          createdAt: '2025-01-01T12:00:00Z',
          updatedAt: '2025-01-01T12:00:00Z',
          event: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Tech Conference 2025',
            organizerId: '123e4567-e89b-12d3-a456-426614174002',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Announcement not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Announcement with ID announcementId not found',
          error: 'Not Found',
        },
      },
    }),
    ApiParam({
      name: 'id',
      description: 'Announcement ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );

/**************************************
 * UPDATE OPERATIONS
 **************************************/

export const UpdateAnnouncementSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update an announcement' }),
    ApiResponse({
      status: 200,
      description: 'The announcement has been updated',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          eventId: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Updated Title',
          description: 'Updated description with new information',
          image: 'https://example.com/updated-image.jpg',
          createdAt: '2025-01-01T12:00:00Z',
          updatedAt: '2025-01-01T14:30:00Z',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description:
        'Forbidden - only event organizers and admins can update announcements',
      schema: {
        example: {
          statusCode: 403,
          message: 'Only event organizers or admins can update announcements',
          error: 'Forbidden',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Announcement not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Announcement with ID announcementId not found',
          error: 'Not Found',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error',
      schema: {
        example: {
          statusCode: 400,
          message: ['title should not be empty'],
          error: 'Bad Request',
        },
      },
    }),
    ApiParam({
      name: 'id',
      description: 'Announcement ID to update',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({ type: UpdateAnnouncementDto }),
  );

/**************************************
 * DELETE OPERATIONS
 **************************************/

export const DeleteAnnouncementSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Delete an announcement' }),
    ApiResponse({
      status: 200,
      description: 'The announcement has been deleted',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          eventId: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Deleted Announcement',
          description: 'This announcement has been deleted',
          image: null,
          createdAt: '2025-01-01T12:00:00Z',
          updatedAt: '2025-01-01T12:00:00Z',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description:
        'Forbidden - only event organizers and admins can delete announcements',
      schema: {
        example: {
          statusCode: 403,
          message: 'Only event organizers or admins can delete announcements',
          error: 'Forbidden',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Announcement not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Announcement with ID announcementId not found',
          error: 'Not Found',
        },
      },
    }),
    ApiParam({
      name: 'id',
      description: 'Announcement ID to delete',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );
