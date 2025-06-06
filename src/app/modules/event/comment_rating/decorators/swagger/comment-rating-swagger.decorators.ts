import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateCommentRatingDto } from '../../dto/create-comment-rating.dto';
import { UpdateCommentRatingDto } from '../../dto/update-comment-rating.dto';


/**************************************
 * CONTROLLER DECORATOR
 **************************************/

export const CommentRatingControllerSwagger = () =>
  applyDecorators(
    ApiTags('comments-ratings'),
    ApiBearerAuth(),
  );

/**************************************
 * CREATE OPERATIONS
 **************************************/

export const CreateCommentRatingSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a new comment and rating' }),
    ApiResponse({
      status: 201,
      description: 'The comment and rating has been created',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          commentText: 'This was an excellent event with great speakers and networking opportunities.',
          rating: 5,
          eventId: '123e4567-e89b-12d3-a456-426614174001',
          userId: '123e4567-e89b-12d3-a456-426614174002',
          status: 'ACTIVE',
          createdAt: '2025-01-01T12:00:00Z',
          user: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            fullName: 'John Doe',
            username: 'johndoe'
          }
        }
      }
    }),
    ApiResponse({ 
      status: 400, 
      description: 'Invalid input',
      schema: {
        example: {
          statusCode: 400,
          message: ['rating must be between 1 and 5', 'commentText should not be empty'],
          error: 'Bad Request'
        }
      }
    }),
    ApiResponse({
      status: 403,
      description: 'User is not authorized or event has not ended',
      schema: {
        example: {
          statusCode: 403,
          message: 'Comments and ratings can only be submitted for completed events',
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
    ApiResponse({
      status: 409,
      description: 'User has already commented on this event',
      schema: {
        example: {
          statusCode: 409,
          message: 'You have already submitted a comment and rating for this event',
          error: 'Conflict'
        }
      }
    }),
    ApiBody({
      type: CreateCommentRatingDto,
      description: 'Comment and rating data',
    }),
  );

/**************************************
 * READ OPERATIONS
 **************************************/

export const GetEventCommentsRatingsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all comments and ratings for an event' }),
    ApiResponse({
      status: 200,
      description: 'Returns all comments and ratings for the event',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            commentText: 'Excellent event, highly recommend!',
            rating: 5,
            createdAt: '2025-01-01T12:00:00Z',
            user: {
              id: '123e4567-e89b-12d3-a456-426614174002',
              fullName: 'John Doe',
              username: 'johndoe'
            }
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            commentText: 'Great speakers and networking opportunities.',
            rating: 4,
            createdAt: '2025-01-01T11:30:00Z',
            user: {
              id: '123e4567-e89b-12d3-a456-426614174004',
              fullName: 'Jane Smith',
              username: 'janesmith'
            }
          }
        ]
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
  );

export const GetEventRatingStatsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get rating statistics for an event' }),
    ApiResponse({
      status: 200,
      description: 'Returns rating statistics for the event',
      schema: {
        example: {
          averageRating: 4.2,
          totalRatings: 25,
          highestRating: 5,
          lowestRating: 2,
          ratingDistribution: [
            { rating: 1, count: 0 },
            { rating: 2, count: 2 },
            { rating: 3, count: 3 },
            { rating: 4, count: 8 },
            { rating: 5, count: 12 }
          ]
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
  );

export const GetUserCommentsRatingsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all comments and ratings by the current user' }),
    ApiResponse({
      status: 200,
      description: 'Returns all comments and ratings by the user',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            commentText: 'Amazing conference!',
            rating: 5,
            createdAt: '2025-01-01T12:00:00Z',
            event: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Tech Conference 2025',
              dateTime: '2025-01-01T10:00:00Z'
            }
          }
        ]
      }
    }),
  );

export const GetSpecificUserCommentsRatingsSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all comments and ratings by a specific user (Admin only)',
    }),
    ApiResponse({
      status: 200,
      description: 'Returns all comments and ratings by the user',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            commentText: 'Great event!',
            rating: 4,
            createdAt: '2025-01-01T12:00:00Z',
            event: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Business Summit 2025',
              dateTime: '2025-01-01T09:00:00Z'
            }
          }
        ]
      }
    }),
    ApiResponse({ 
      status: 403, 
      description: 'Not authorized',
      schema: {
        example: {
          statusCode: 403,
          message: 'Insufficient permissions',
          error: 'Forbidden'
        }
      }
    }),
    ApiParam({ 
      name: 'userId', 
      description: 'User ID',
      example: '123e4567-e89b-12d3-a456-426614174000'
    }),
  );

export const GetOneCommentRatingSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get a specific comment and rating by ID' }),
    ApiResponse({ 
      status: 200, 
      description: 'Returns the comment and rating',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          commentText: 'Excellent event with great speakers!',
          rating: 5,
          status: 'ACTIVE',
          createdAt: '2025-01-01T12:00:00Z',
          user: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            fullName: 'John Doe',
            username: 'johndoe'
          },
          event: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Tech Conference 2025',
            dateTime: '2025-01-01T10:00:00Z'
          }
        }
      }
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Comment not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Comment with ID commentId not found',
          error: 'Not Found'
        }
      }
    }),
    ApiParam({ 
      name: 'id', 
      description: 'Comment ID',
      example: '123e4567-e89b-12d3-a456-426614174000'
    }),
  );

/**************************************
 * UPDATE OPERATIONS
 **************************************/

export const UpdateCommentRatingSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update a comment and rating' }),
    ApiResponse({
      status: 200,
      description: 'The comment and rating has been updated',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          commentText: 'Updated: This was an excellent event!',
          rating: 4,
          status: 'ACTIVE',
          updatedAt: '2025-01-01T14:30:00Z',
          user: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            fullName: 'John Doe',
            username: 'johndoe'
          },
          event: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Tech Conference 2025'
          }
        }
      }
    }),
    ApiResponse({
      status: 403,
      description: 'Not authorized to update this comment',
      schema: {
        example: {
          statusCode: 403,
          message: 'You can only modify your own comments or comments on events you organize',
          error: 'Forbidden'
        }
      }
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Comment not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Comment with ID commentId not found',
          error: 'Not Found'
        }
      }
    }),
    ApiParam({ 
      name: 'id', 
      description: 'Comment ID',
      example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    ApiBody({
      type: UpdateCommentRatingDto,
      description: 'Updated comment and rating data',
    }),
  );

/**************************************
 * DELETE OPERATIONS
 **************************************/

export const DeleteCommentRatingSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Delete (soft) a comment and rating' }),
    ApiResponse({
      status: 200,
      description: 'The comment and rating has been deleted',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          commentText: 'This comment has been deleted',
          rating: 5,
          status: 'DELETED',
          updatedAt: '2025-01-01T16:00:00Z'
        }
      }
    }),
    ApiResponse({
      status: 403,
      description: 'Not authorized to delete this comment',
      schema: {
        example: {
          statusCode: 403,
          message: 'You can only delete your own comments or comments on events you organize',
          error: 'Forbidden'
        }
      }
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Comment not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'Comment with ID commentId not found',
          error: 'Not Found'
        }
      }
    }),
    ApiParam({ 
      name: 'id', 
      description: 'Comment ID',
      example: '123e4567-e89b-12d3-a456-426614174000'
    }),
  );