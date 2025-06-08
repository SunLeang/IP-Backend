import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateVolunteerApplicationDto } from '../../dto/create-volunteer-application.dto';
import { UpdateVolunteerApplicationDto } from '../../dto/update-volunteer-application.dto';


/**************************************
 * CONTROLLER DECORATOR
 **************************************/

export const VolunteerControllerSwagger = () =>
  applyDecorators(
    ApiTags('volunteer'),
    ApiBearerAuth(),
  );

/**************************************
 * APPLICATION OPERATIONS
 **************************************/

export const ApplyForEventSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Apply to be a volunteer for an event' }),
    ApiResponse({ status: 201, description: 'The application has been created' }),
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