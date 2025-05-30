import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { UpdateTaskAssignmentDto } from './dto/update-task-assignment.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { GetUser } from '../../../core/decorators/get-user.decorator';
import { Roles } from '../../../core/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  /**************************************
   * CREATE TASK ENDPOINT
   **************************************/
  @Post()
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN, SystemRole.USER) // USER can create for their own events
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'The task has been created' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiBody({ type: CreateTaskDto })
  create(
    @Body() createTaskDto: CreateTaskDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.taskService.create(createTaskDto, userId, userRole);
  }

  /**************************************
   * GET ALL TASKS ENDPOINT
   **************************************/
  @Get()
  @ApiOperation({ summary: 'Get all tasks with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated tasks' })
  @ApiQuery({ type: TaskQueryDto })
  findAll(
    @Query() query: TaskQueryDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.taskService.findAll(query, userId, userRole);
  }

  /**************************************
   * GET MY TASKS ENDPOINT (FOR VOLUNTEERS)
   **************************************/
  @Get('my-tasks')
  @ApiOperation({ summary: 'Get tasks assigned to current volunteer' })
  @ApiResponse({ status: 200, description: 'Return volunteer assigned tasks' })
  @ApiQuery({ type: TaskQueryDto })
  getMyTasks(@GetUser('id') userId: string, @Query() query: TaskQueryDto) {
    return this.taskService.getMyTasks(userId, query);
  }

  /**************************************
   * GET AVAILABLE VOLUNTEERS FOR EVENT
   **************************************/
  @Get('events/:eventId/volunteers')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN, SystemRole.USER)
  @ApiOperation({ summary: 'Get available volunteers for task assignment' })
  @ApiResponse({ status: 200, description: 'Return available volunteers' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  getAvailableVolunteers(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.taskService.getAvailableVolunteers(eventId, userId, userRole);
  }

  /**************************************
   * GET TASK BY ID ENDPOINT
   **************************************/
  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Return the task' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.taskService.findOne(id, userId, userRole);
  }

  /**************************************
   * UPDATE TASK ENDPOINT
   **************************************/
  @Patch(':id')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN, SystemRole.USER)
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'The task has been updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiBody({ type: UpdateTaskDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.taskService.update(id, updateTaskDto, userId, userRole);
  }

  /**************************************
   * DELETE TASK ENDPOINT
   **************************************/
  @Delete(':id')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN, SystemRole.USER)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'The task has been deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.taskService.remove(id, userId, userRole);
  }

  /**************************************
   * ASSIGN TASK ENDPOINT
   **************************************/
  @Post(':id/assign')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN, SystemRole.USER)
  @ApiOperation({ summary: 'Assign a task to a volunteer' })
  @ApiResponse({ status: 201, description: 'The task has been assigned' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - volunteer not available',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiBody({ type: AssignTaskDto })
  assignTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignTaskDto: AssignTaskDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.taskService.assignTask(id, assignTaskDto, userId, userRole);
  }

  /**************************************
   * UPDATE TASK ASSIGNMENT ENDPOINT
   **************************************/
  @Patch('assignments/:assignmentId')
  @ApiOperation({ summary: 'Update task assignment status' })
  @ApiResponse({ status: 200, description: 'The assignment has been updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiBody({ type: UpdateTaskAssignmentDto })
  updateAssignment(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() updateDto: UpdateTaskAssignmentDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.taskService.updateAssignment(
      assignmentId,
      updateDto,
      userId,
      userRole,
    );
  }

  /**************************************
   * REMOVE TASK ASSIGNMENT ENDPOINT
   **************************************/
  @Delete('assignments/:assignmentId')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN, SystemRole.USER)
  @ApiOperation({ summary: 'Remove task assignment' })
  @ApiResponse({ status: 200, description: 'The assignment has been removed' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  removeAssignment(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.taskService.removeAssignment(assignmentId, userId, userRole);
  }
}
