import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

/**************************************
 * CONTROLLER DECORATOR
 **************************************/

export const NotificationControllerSwagger = () =>
  applyDecorators(
    ApiTags('notifications'),
    ApiBearerAuth(),
  );

/**************************************
 * READ OPERATIONS
 **************************************/

export const GetAllNotificationsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all notifications for current user' }),
    ApiResponse({
      status: 200,
      description: 'Return all notifications',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            userId: 'user-id',
            eventId: 'event-id',
            announcementId: null,
            applicationId: null,
            type: 'EVENT_UPDATE',
            message: 'Event "Tech Conference 2025" has been updated',
            read: false,
            sentAt: '2025-01-01T12:00:00Z',
            event: {
              id: 'event-id',
              name: 'Tech Conference 2025'
            },
            announcement: null,
            application: null
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            userId: 'user-id',
            eventId: 'event-id',
            announcementId: 'announcement-id',
            applicationId: null,
            type: 'ANNOUNCEMENT',
            message: 'New announcement for Tech Conference 2025: Important Update',
            read: true,
            sentAt: '2025-01-01T10:30:00Z',
            event: {
              id: 'event-id',
              name: 'Tech Conference 2025'
            },
            announcement: {
              id: 'announcement-id',
              title: 'Important Update',
              description: 'Please note the venue change'
            },
            application: null
          }
        ]
      }
    }),
  );

export const GetNotificationByIdSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get notification by id' }),
    ApiResponse({
      status: 200,
      description: 'Return notification by id',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: 'user-id',
          eventId: 'event-id',
          announcementId: null,
          applicationId: 'application-id',
          type: 'APPLICATION_UPDATE',
          message: 'Your volunteer application for Tech Conference 2025 has been approved',
          read: false,
          sentAt: '2025-01-01T14:00:00Z',
          event: {
            id: 'event-id',
            name: 'Tech Conference 2025'
          },
          announcement: null,
          application: {
            id: 'application-id',
            status: 'APPROVED',
            event: {
              id: 'event-id',
              name: 'Tech Conference 2025'
            }
          }
        }
      }
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Notification not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Notification with ID notificationId not found',
          error: 'Not Found'
        }
      }
    }),
    ApiParam({ 
      name: 'id', 
      description: 'Notification ID',
      example: '123e4567-e89b-12d3-a456-426614174000'
    }),
  );

export const GetUnreadCountSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get unread notification count' }),
    ApiResponse({
      status: 200,
      description: 'Return unread notification count',
      schema: {
        example: {
          count: 5
        }
      }
    }),
  );

/**************************************
 * UPDATE OPERATIONS
 **************************************/

export const MarkNotificationAsReadSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Mark notification as read' }),
    ApiResponse({
      status: 200,
      description: 'The notification has been marked as read',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          userId: 'user-id',
          eventId: 'event-id',
          announcementId: null,
          applicationId: null,
          type: 'EVENT_UPDATE',
          message: 'Event "Tech Conference 2025" has been updated',
          read: true,
          sentAt: '2025-01-01T12:00:00Z'
        }
      }
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Notification not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Notification with ID notificationId not found',
          error: 'Not Found'
        }
      }
    }),
    ApiParam({ 
      name: 'id', 
      description: 'Notification ID',
      example: '123e4567-e89b-12d3-a456-426614174000'
    }),
  );

export const MarkAllNotificationsAsReadSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Mark all notifications as read' }),
    ApiResponse({
      status: 200,
      description: 'All notifications have been marked as read',
      schema: {
        example: {
          count: 8
        }
      }
    }),
  );