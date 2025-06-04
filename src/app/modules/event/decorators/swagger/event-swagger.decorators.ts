import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';

/**************************************
 * CONTROLLER LEVEL DECORATORS
 **************************************/
export const EventControllerSwagger = () =>
  applyDecorators(ApiTags('events'), ApiBearerAuth());

/**************************************
 * CREATE EVENT ENDPOINT DECORATORS
 **************************************/
export const CreateEventSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a new event' }),
    ApiResponse({
      status: 201,
      description: 'The event has been successfully created',
    }),
    ApiResponse({ status: 400, description: 'Invalid input data' }),
    ApiResponse({ status: 404, description: 'Category not found' }),
    ApiBody({
      schema: {
        example: {
          name: 'Tech Conference 2025',
          description:
            'Annual technology conference featuring the latest innovations',
          dateTime: '2025-07-15T09:00:00Z',
          locationDesc: 'Convention Center, Downtown',
          locationImage: 'https://example.com/location.jpg',
          profileImage: 'https://example.com/profile.jpg',
          coverImage: 'https://example.com/cover.jpg',
          status: 'DRAFT',
          categoryId: 'your-category-id-here',
          acceptingVolunteers: false,
        },
      },
    }),
  );

/**************************************
 * GET ALL EVENTS ENDPOINT DECORATORS
 **************************************/
export const FindAllEventsSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all events with optional filtering' }),
    ApiResponse({
      status: 200,
      description: 'Return all events matching the criteria',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: EventStatus,
      description: 'Filter by event status',
    }),
    ApiQuery({
      name: 'categoryId',
      required: false,
      description: 'Filter by category ID',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search in event name and description',
    }),
    ApiQuery({
      name: 'skip',
      required: false,
      description: 'Number of records to skip for pagination',
    }),
    ApiQuery({
      name: 'take',
      required: false,
      description: 'Number of records to take for pagination',
    }),
    ApiQuery({
      name: 'orderBy',
      required: false,
      description: 'Field to order by',
      example: 'dateTime',
    }),
    ApiQuery({
      name: 'orderDir',
      required: false,
      description: 'Direction to order by',
      example: 'desc',
    }),
  );

/**************************************
 * GET EVENT BY ID ENDPOINT DECORATORS
 **************************************/
export const FindOneEventSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get event by ID' }),
    ApiResponse({ status: 200, description: 'Return the event data' }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiParam({ name: 'id', description: 'Event ID' }),
  );

/**************************************
 * UPDATE EVENT ENDPOINT DECORATORS
 **************************************/
export const UpdateEventSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update an event' }),
    ApiResponse({
      status: 200,
      description: 'The event has been successfully updated',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - not authorized to update this event',
    }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiParam({ name: 'id', description: 'Event ID' }),
    ApiBody({
      schema: {
        example: {
          name: 'Updated Event Name',
          description: 'Updated event description',
          status: 'PUBLISHED',
        },
      },
    }),
  );

/**************************************
 * DELETE EVENT ENDPOINT DECORATORS
 **************************************/
export const RemoveEventSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Delete an event (soft delete)' }),
    ApiResponse({
      status: 200,
      description: 'The event has been successfully deleted',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - not authorized to delete this event',
    }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiParam({ name: 'id', description: 'Event ID' }),
  );

/**************************************
 * UPDATE EVENT STATUS ENDPOINT DECORATORS
 **************************************/
export const UpdateEventStatusSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update event status' }),
    ApiResponse({
      status: 200,
      description: 'The event status has been successfully updated',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - not authorized to update this event',
    }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiParam({ name: 'id', description: 'Event ID' }),
    ApiBody({
      schema: {
        example: {
          status: 'PUBLISHED',
        },
      },
    }),
  );

/**************************************
 * TOGGLE VOLUNTEER APPLICATIONS ENDPOINT DECORATORS
 **************************************/
export const ToggleVolunteerApplicationsSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Toggle volunteer application acceptance for an event',
    }),
    ApiResponse({
      status: 200,
      description: 'The volunteer application status has been toggled',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - not authorized to update this event',
    }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiParam({ name: 'id', description: 'Event ID' }),
    ApiBody({
      schema: {
        example: {
          acceptingVolunteers: true,
        },
      },
    }),
  );

/**************************************
 * GET EVENTS BY ORGANIZER ENDPOINT DECORATORS
 **************************************/
export const GetEventsByOrganizerSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all events organized by a specific user' }),
    ApiResponse({
      status: 200,
      description: 'Return all events for the organizer',
    }),
    ApiParam({ name: 'organizerId', description: 'Organizer user ID' }),
  );

/**************************************
 * GET EVENT ATTENDEES ENDPOINT DECORATORS
 **************************************/
export const GetEventAttendeesSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all attendees for an event' }),
    ApiResponse({ status: 200, description: 'Return all event attendees' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - admin access required',
    }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiParam({ name: 'id', description: 'Event ID' }),
  );

/**************************************
 * GET EVENT VOLUNTEERS ENDPOINT DECORATORS
 **************************************/
export const GetEventVolunteersSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all volunteers for an event' }),
    ApiResponse({ status: 200, description: 'Return all event volunteers' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - admin access required',
    }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiParam({ name: 'id', description: 'Event ID' }),
  );

  /**************************************
 * DASHBOARD CONTROLLER LEVEL DECORATORS
 **************************************/
export const EventDashboardControllerSwagger = () =>
  applyDecorators(ApiTags('event-dashboard'), ApiBearerAuth());

/**************************************
 * ADMIN DASHBOARD ENDPOINT DECORATORS
 **************************************/
export const AdminDashboardSwagger = () =>
  applyDecorators(
    ApiOperation({ 
      summary: 'Get admin dashboard overview',
      description: 'Get comprehensive dashboard data including event counts, recent events, and statistics. Super admins see system-wide data, regular admins see only their events.'
    }),
    ApiResponse({ 
      status: 200, 
      description: 'Dashboard data successfully retrieved',
      schema: {
        example: {
          role: 'SUPER_ADMIN',
          overview: {
            totalEvents: 1533,
            publishedEvents: 800,
            draftEvents: 150,
            completedEvents: 500,
            cancelledEvents: 83,
            totalAttendees: 25000,
            totalVolunteers: 1200
          },
          upcomingEvents: {
            totalCount: 800,
            currentPage: 1,
            totalPages: 40,
            hasMore: true,
            events: '... first 20 events'
          }
        }
      }
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - admin access required',
    }),
  );

/**************************************
 * PAGINATED DASHBOARD ENDPOINTS
 **************************************/
export const GetUpcomingEventsPaginatedSwagger = () =>
  applyDecorators(
    ApiOperation({ 
      summary: 'Get paginated upcoming events for dashboard',
      description: 'Retrieve upcoming published events with pagination. Super admins see all upcoming events, regular admins see only their upcoming events.'
    }),
    ApiResponse({ 
      status: 200, 
      description: 'Paginated upcoming events retrieved successfully',
      schema: {
        example: {
          data: '... array of events',
          meta: {
            total: 800,
            page: 1,
            limit: 20,
            totalPages: 40,
            hasMore: true
          }
        }
      }
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - admin access required',
    }),
    ApiQuery({ 
      name: 'page', 
      required: false, 
      description: 'Page number (default: 1)',
      example: 1
    }),
    ApiQuery({ 
      name: 'limit', 
      required: false, 
      description: 'Items per page (default: 20, max: 100)',
      example: 20
    }),
  );

export const GetCompletedEventsPaginatedSwagger = () =>
  applyDecorators(
    ApiOperation({ 
      summary: 'Get paginated completed events for dashboard',
      description: 'Retrieve completed events with pagination. Super admins see all completed events, regular admins see only their completed events.'
    }),
    ApiResponse({ 
      status: 200, 
      description: 'Paginated completed events retrieved successfully'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - admin access required',
    }),
    ApiQuery({ 
      name: 'page', 
      required: false, 
      description: 'Page number (default: 1)',
      example: 1
    }),
    ApiQuery({ 
      name: 'limit', 
      required: false, 
      description: 'Items per page (default: 20, max: 100)',
      example: 20
    }),
  );

export const GetDraftEventsPaginatedSwagger = () =>
  applyDecorators(
    ApiOperation({ 
      summary: 'Get paginated draft events for dashboard',
      description: 'Retrieve draft events with pagination. Super admins see all draft events, regular admins see only their draft events.'
    }),
    ApiResponse({ 
      status: 200, 
      description: 'Paginated draft events retrieved successfully'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - admin access required',
    }),
    ApiQuery({ 
      name: 'page', 
      required: false, 
      description: 'Page number (default: 1)',
      example: 1
    }),
    ApiQuery({ 
      name: 'limit', 
      required: false, 
      description: 'Items per page (default: 20, max: 100)',
      example: 20
    }),
  );

export const GetCancelledEventsPaginatedSwagger = () =>
  applyDecorators(
    ApiOperation({ 
      summary: 'Get paginated cancelled events for dashboard',
      description: 'Retrieve cancelled events with pagination. Super admins see all cancelled events, regular admins see only their cancelled events.'
    }),
    ApiResponse({ 
      status: 200, 
      description: 'Paginated cancelled events retrieved successfully'
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - admin access required',
    }),
    ApiQuery({ 
      name: 'page', 
      required: false, 
      description: 'Page number (default: 1)',
      example: 1
    }),
    ApiQuery({ 
      name: 'limit', 
      required: false, 
      description: 'Items per page (default: 20, max: 100)',
      example: 20
    }),
  );

/**************************************
 * DASHBOARD ANALYTICS ENDPOINTS
 **************************************/
export const GetDashboardStatsSwagger = () =>
  applyDecorators(
    ApiOperation({ 
      summary: 'Get dashboard statistics only',
      description: 'Get only the overview statistics without event data for quick dashboard metrics.'
    }),
    ApiResponse({ 
      status: 200, 
      description: 'Dashboard statistics retrieved successfully',
      schema: {
        example: {
          role: 'ADMIN',
          totalEvents: 25,
          publishedEvents: 15,
          draftEvents: 5,
          completedEvents: 4,
          cancelledEvents: 1,
          totalAttendees: 500,
          totalVolunteers: 50
        }
      }
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - admin access required',
    }),
  );

export const GetEventsByOrganizerDashboardSwagger = () =>
  applyDecorators(
    ApiOperation({ 
      summary: 'Get events by organizer for dashboard',
      description: 'Get all events organized by a specific user with dashboard-optimized data.'
    }),
    ApiResponse({
      status: 200,
      description: 'Organizer events retrieved successfully',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - admin access required',
    }),
    ApiParam({ 
      name: 'organizerId', 
      description: 'Organizer user ID',
      example: 'cm123456789'
    }),
  );