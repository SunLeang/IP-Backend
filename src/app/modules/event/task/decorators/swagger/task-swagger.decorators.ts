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
  applyDecorators(
    ApiTags('tasks'),
    ApiBearerAuth(),
  );

/**************************************
 * CREATE OPERATIONS
 **************************************/

export const CreateTaskSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a new task' }),
    ApiResponse({ status: 201, description: 'The task has been created' }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiBody({ type: CreateTaskDto }),
  );

/**************************************
 * READ OPERATIONS
 **************************************/

export const GetAllTasksSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all tasks with filtering and pagination' }),
    ApiResponse({ status: 200, description: 'Return paginated tasks' }),
    ApiQuery({ type: TaskQueryDto }),
  );

export const GetMyTasksSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get tasks assigned to current volunteer' }),
    ApiResponse({ status: 200, description: 'Return volunteer assigned tasks' }),
    ApiQuery({ type: TaskQueryDto }),
  );

export const GetAvailableVolunteersSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get available volunteers for task assignment' }),
    ApiResponse({ status: 200, description: 'Return available volunteers' }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Event not found' }),
    ApiParam({ name: 'eventId', description: 'Event ID' }),
  );

export const GetTaskByIdSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get task by ID' }),
    ApiResponse({ status: 200, description: 'Return the task' }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Task not found' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
  );

/**************************************
 * UPDATE OPERATIONS
 **************************************/

export const UpdateTaskSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update a task' }),
    ApiResponse({ status: 200, description: 'The task has been updated' }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Task not found' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiBody({ type: UpdateTaskDto }),
  );

/**************************************
 * DELETE OPERATIONS
 **************************************/

export const DeleteTaskSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Delete a task' }),
    ApiResponse({ status: 200, description: 'The task has been deleted' }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Task not found' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
  );

/**************************************
 * ASSIGNMENT OPERATIONS
 **************************************/

export const AssignTaskSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Assign a task to a volunteer' }),
    ApiResponse({ status: 201, description: 'The task has been assigned' }),
    ApiResponse({
      status: 400,
      description: 'Bad request - volunteer not available',
    }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Task not found' }),
    ApiParam({ name: 'id', description: 'Task ID' }),
    ApiBody({ type: AssignTaskDto }),
  );

export const UpdateTaskAssignmentSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update task assignment status' }),
    ApiResponse({ status: 200, description: 'The assignment has been updated' }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Assignment not found' }),
    ApiParam({ name: 'assignmentId', description: 'Assignment ID' }),
    ApiBody({ type: UpdateTaskAssignmentDto }),
  );

export const RemoveTaskAssignmentSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Remove task assignment' }),
    ApiResponse({ status: 200, description: 'The assignment has been removed' }),
    ApiResponse({ status: 403, description: 'Forbidden - not authorized' }),
    ApiResponse({ status: 404, description: 'Assignment not found' }),
    ApiParam({ name: 'assignmentId', description: 'Assignment ID' }),
  );