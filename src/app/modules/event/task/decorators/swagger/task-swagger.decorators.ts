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
import { AssignTaskDto } from '../../dto/assign-task.dto';
import { CreateTaskDto } from '../../dto/create-task.dto';
import { TaskQueryDto } from '../../dto/task-query.dto';
import { UpdateTaskAssignmentDto } from '../../dto/update-task-assignment.dto';
import { UpdateTaskDto } from '../../dto/update-task.dto';

/**************************************
 * CONTROLLER DECORATOR
 **************************************/

export const TaskControllerSwagger = () =>
  applyDecorators(ApiTags('tasks'), ApiBearerAuth());

/**************************************
 * CREATE OPERATIONS
 **************************************/

export const CreateTaskSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a new task' }),
    ApiResponse({
      status: 201,
      description: 'The task has been created',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Setup registration booth',
          description: 'Set up the registration booth and welcome attendees',
          type: 'Setup',
          status: 'PENDING',
          dueDate: '2025-02-15T08:00:00Z',
          createdAt: '2025-01-15T10:30:00Z',
          updatedAt: '2025-01-15T10:30:00Z',
          event: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Tech Conference 2025',
            organizerId: '123e4567-e89b-12d3-a456-426614174002',
          },
          assignments: [],
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiBody({
      type: CreateTaskDto,
      examples: {
        setupTask: {
          summary: 'Setup Task',
          value: {
            name: 'Setup registration booth',
            description: 'Set up the registration booth and welcome attendees',
            type: 'Setup',
            dueDate: '2025-02-15T08:00:00Z',
            eventId: '123e4567-e89b-12d3-a456-426614174001',
            status: 'PENDING',
          },
        },
        coordinationTask: {
          summary: 'Coordination Task',
          value: {
            name: 'Coordinate speaker logistics',
            description:
              'Ensure speakers have proper setup and technical support',
            type: 'Coordination',
            dueDate: '2025-02-15T09:30:00Z',
            eventId: '123e4567-e89b-12d3-a456-426614174001',
          },
        },
      },
    }),
  );

/**************************************
 * READ OPERATIONS
 **************************************/

export const GetAllTasksSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all tasks with filtering and pagination' }),
    ApiResponse({
      status: 200,
      description: 'Return paginated tasks',
      schema: {
        example: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Setup registration booth',
              description:
                'Set up the registration booth and welcome attendees',
              type: 'Setup',
              status: 'PENDING',
              dueDate: '2025-02-15T08:00:00Z',
              createdAt: '2025-01-15T10:30:00Z',
              updatedAt: '2025-01-15T10:30:00Z',
              event: {
                id: '123e4567-e89b-12d3-a456-426614174001',
                name: 'Tech Conference 2025',
                organizerId: '123e4567-e89b-12d3-a456-426614174002',
              },
              assignments: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174003',
                  status: 'PENDING',
                  assignedAt: '2025-01-16T14:00:00Z',
                  volunteer: {
                    id: '123e4567-e89b-12d3-a456-426614174004',
                    fullName: 'John Volunteer',
                    email: 'john@example.com',
                  },
                  assignedBy: {
                    id: '123e4567-e89b-12d3-a456-426614174002',
                    fullName: 'Jane Organizer',
                  },
                },
              ],
            },
          ],
          meta: {
            total: 15,
            skip: 0,
            take: 10,
            hasMore: true,
          },
        },
      },
    }),
    ApiQuery({
      name: 'status',
      required: false,
      description: 'Filter by task status',
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      example: 'PENDING',
    }),
    ApiQuery({
      name: 'eventId',
      required: false,
      description: 'Filter by event ID',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search by task name or description',
      example: 'registration',
    }),
    ApiQuery({
      name: 'skip',
      required: false,
      description: 'Number of records to skip',
      example: 0,
    }),
    ApiQuery({
      name: 'take',
      required: false,
      description: 'Number of records to take',
      example: 10,
    }),
  );

export const GetMyTasksSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get tasks assigned to current volunteer' }),
    ApiResponse({
      status: 200,
      description: 'Return volunteer assigned tasks',
      schema: {
        example: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174003',
              status: 'IN_PROGRESS',
              assignedAt: '2025-01-16T14:00:00Z',
              task: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Setup registration booth',
                description:
                  'Set up the registration booth and welcome attendees',
                type: 'Setup',
                status: 'IN_PROGRESS',
                dueDate: '2025-02-15T08:00:00Z',
                event: {
                  id: '123e4567-e89b-12d3-a456-426614174001',
                  name: 'Tech Conference 2025',
                },
              },
              assignedBy: {
                id: '123e4567-e89b-12d3-a456-426614174002',
                fullName: 'Jane Organizer',
              },
            },
          ],
          meta: {
            total: 3,
            skip: 0,
            take: 10,
            hasMore: false,
          },
        },
      },
    }),
  );

export const GetAvailableVolunteersSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get available volunteers for task assignment' }),
    ApiResponse({
      status: 200,
      description: 'Return available volunteers',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174004',
            fullName: 'John Volunteer',
            email: 'john@example.com',
            age: 28,
            org: 'Tech Corp',
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174005',
            fullName: 'Sarah Helper',
            email: 'sarah@example.com',
            age: 25,
            org: 'University',
          },
        ],
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiParam({
      name: 'eventId',
      description: 'Event ID',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
  );

export const GetTaskByIdSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get task by ID' }),
    ApiResponse({
      status: 200,
      description: 'Return the task',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Setup registration booth',
          description: 'Set up the registration booth and welcome attendees',
          type: 'Setup',
          status: 'IN_PROGRESS',
          dueDate: '2025-02-15T08:00:00Z',
          createdAt: '2025-01-15T10:30:00Z',
          updatedAt: '2025-01-16T15:20:00Z',
          event: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Tech Conference 2025',
            organizerId: '123e4567-e89b-12d3-a456-426614174002',
          },
          assignments: [
            {
              id: '123e4567-e89b-12d3-a456-426614174003',
              status: 'IN_PROGRESS',
              assignedAt: '2025-01-16T14:00:00Z',
              volunteer: {
                id: '123e4567-e89b-12d3-a456-426614174004',
                fullName: 'John Volunteer',
                email: 'john@example.com',
              },
              assignedBy: {
                id: '123e4567-e89b-12d3-a456-426614174002',
                fullName: 'Jane Organizer',
              },
            },
          ],
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Task not found' }),
    ApiParam({
      name: 'id',
      description: 'Task ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );

/**************************************
 * UPDATE OPERATIONS
 **************************************/

export const UpdateTaskSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update a task' }),
    ApiResponse({
      status: 200,
      description: 'The task has been updated',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Setup registration booth (Updated)',
          description:
            'Set up the registration booth and welcome attendees with new signage',
          type: 'Setup',
          status: 'IN_PROGRESS',
          dueDate: '2025-02-15T07:30:00Z',
          createdAt: '2025-01-15T10:30:00Z',
          updatedAt: '2025-01-17T09:15:00Z',
          event: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Tech Conference 2025',
            organizerId: '123e4567-e89b-12d3-a456-426614174002',
          },
          assignments: [],
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Task not found' }),
    ApiParam({
      name: 'id',
      description: 'Task ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      type: UpdateTaskDto,
      examples: {
        updateName: {
          summary: 'Update task name and description',
          value: {
            name: 'Setup registration booth (Updated)',
            description:
              'Set up the registration booth and welcome attendees with new signage',
          },
        },
        updateStatus: {
          summary: 'Update task status',
          value: {
            status: 'IN_PROGRESS',
          },
        },
        updateDueDate: {
          summary: 'Update due date',
          value: {
            dueDate: '2025-02-15T07:30:00Z',
          },
        },
      },
    }),
  );

/**************************************
 * DELETE OPERATIONS
 **************************************/

export const DeleteTaskSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Delete a task' }),
    ApiResponse({
      status: 200,
      description: 'The task has been deleted',
      schema: {
        example: {
          success: true,
          message: 'Task deleted successfully',
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Task not found' }),
    ApiParam({
      name: 'id',
      description: 'Task ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );

/**************************************
 * ASSIGNMENT OPERATIONS
 **************************************/

export const AssignTaskSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Assign a task to a volunteer' }),
    ApiResponse({
      status: 201,
      description: 'The task has been assigned',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          status: 'PENDING',
          assignedAt: '2025-01-16T14:00:00Z',
          task: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Setup registration booth',
            description: 'Set up the registration booth and welcome attendees',
            type: 'Setup',
            status: 'PENDING',
            dueDate: '2025-02-15T08:00:00Z',
            event: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Tech Conference 2025',
            },
          },
          volunteer: {
            id: '123e4567-e89b-12d3-a456-426614174004',
            fullName: 'John Volunteer',
            email: 'john@example.com',
          },
          assignedBy: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            fullName: 'Jane Organizer',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - volunteer not available',
      schema: {
        example: {
          statusCode: 400,
          message: 'The volunteer is not approved for this event',
          error: 'Bad Request',
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Task not found' }),
    ApiParam({
      name: 'id',
      description: 'Task ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      type: AssignTaskDto,
      examples: {
        assignVolunteer: {
          summary: 'Assign task to volunteer',
          value: {
            volunteerId: '123e4567-e89b-12d3-a456-426614174004',
          },
        },
      },
    }),
  );

export const UpdateTaskAssignmentSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update task assignment status' }),
    ApiResponse({
      status: 200,
      description: 'The assignment has been updated',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174003',
          status: 'COMPLETED',
          assignedAt: '2025-01-16T14:00:00Z',
          task: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Setup registration booth',
            event: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Tech Conference 2025',
            },
          },
          volunteer: {
            id: '123e4567-e89b-12d3-a456-426614174004',
            fullName: 'John Volunteer',
          },
          assignedBy: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            fullName: 'Jane Organizer',
          },
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Assignment not found' }),
    ApiParam({
      name: 'assignmentId',
      description: 'Assignment ID',
      example: '123e4567-e89b-12d3-a456-426614174003',
    }),
    ApiBody({
      type: UpdateTaskAssignmentDto,
      examples: {
        markInProgress: {
          summary: 'Mark task as in progress',
          value: {
            status: 'IN_PROGRESS',
          },
        },
        markCompleted: {
          summary: 'Mark task as completed',
          value: {
            status: 'COMPLETED',
          },
        },
      },
    }),
  );

export const RemoveTaskAssignmentSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Remove task assignment' }),
    ApiResponse({
      status: 200,
      description: 'The assignment has been removed',
      schema: {
        example: {
          success: true,
          message: 'Assignment removed successfully',
        },
      },
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Assignment not found' }),
    ApiParam({
      name: 'assignmentId',
      description: 'Assignment ID',
      example: '123e4567-e89b-12d3-a456-426614174003',
    }),
  );

export const GetEventTasksSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all tasks for a specific event' }),
    ApiResponse({
      status: 200,
      description: 'Return tasks for the event with pagination',
      schema: {
        example: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Setup registration booth',
              description:
                'Set up the registration booth and welcome attendees',
              type: 'Setup',
              status: 'PENDING',
              dueDate: '2025-02-15T08:00:00Z',
              createdAt: '2025-01-15T10:30:00Z',
              updatedAt: '2025-01-15T10:30:00Z',
              event: {
                id: '123e4567-e89b-12d3-a456-426614174001',
                name: 'Tech Conference 2025',
                organizerId: '123e4567-e89b-12d3-a456-426614174002',
              },
              assignments: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174003',
                  status: 'PENDING',
                  assignedAt: '2025-01-16T14:00:00Z',
                  volunteer: {
                    id: '123e4567-e89b-12d3-a456-426614174004',
                    fullName: 'John Volunteer',
                    email: 'john@example.com',
                  },
                  assignedBy: {
                    id: '123e4567-e89b-12d3-a456-426614174002',
                    fullName: 'Jane Organizer',
                  },
                },
              ],
            },
          ],
          meta: {
            total: 8,
            skip: 0,
            take: 10,
            hasMore: false,
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - not authorized to view tasks',
    }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiParam({
      name: 'eventId',
      description: 'Event ID',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      description: 'Filter by task status',
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      example: 'PENDING',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search by task name or description',
      example: 'registration',
    }),
    ApiQuery({
      name: 'skip',
      required: false,
      description: 'Number of records to skip',
      example: 0,
    }),
    ApiQuery({
      name: 'take',
      required: false,
      description: 'Number of records to take',
      example: 10,
    }),
  );

export const GetMyEventTasksSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get my assigned tasks for a specific event' }),
    ApiResponse({
      status: 200,
      description: 'Return volunteer assigned tasks for the event',
      schema: {
        example: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174003',
              status: 'IN_PROGRESS',
              assignedAt: '2025-01-16T14:00:00Z',
              task: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Setup registration booth',
                description:
                  'Set up the registration booth and welcome attendees',
                type: 'Setup',
                status: 'IN_PROGRESS',
                dueDate: '2025-02-15T08:00:00Z',
                event: {
                  id: '123e4567-e89b-12d3-a456-426614174001',
                  name: 'Tech Conference 2025',
                },
              },
              assignedBy: {
                id: '123e4567-e89b-12d3-a456-426614174002',
                fullName: 'Jane Organizer',
              },
            },
          ],
          meta: {
            total: 2,
            skip: 0,
            take: 10,
            hasMore: false,
          },
        },
      },
    }),
    ApiParam({
      name: 'eventId',
      description: 'Event ID',
      example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      description: 'Filter by task status',
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      example: 'IN_PROGRESS',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search by task name or description',
      example: 'registration',
    }),
    ApiQuery({
      name: 'skip',
      required: false,
      description: 'Number of records to skip',
      example: 0,
    }),
    ApiQuery({
      name: 'take',
      required: false,
      description: 'Number of records to take',
      example: 10,
    }),
  );
