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
import { TaskService } from './services/task.service';
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

// Import Swagger decorators
import {
  TaskControllerSwagger,
  CreateTaskSwagger,
  GetAllTasksSwagger,
  GetMyTasksSwagger,
  GetAvailableVolunteersSwagger,
  GetTaskByIdSwagger,
  UpdateTaskSwagger,
  DeleteTaskSwagger,
  AssignTaskSwagger,
  UpdateTaskAssignmentSwagger,
  RemoveTaskAssignmentSwagger,
  GetEventTasksSwagger,
  GetMyEventTasksSwagger,
} from './decorators/swagger';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/
@TaskControllerSwagger()
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  /**************************************
   * CREATE TASK ENDPOINT
   **************************************/
  @CreateTaskSwagger()
  @Post()
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN, SystemRole.USER)
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
  @GetAllTasksSwagger()
  @Get()
  findAll(
    @Query() query: TaskQueryDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.taskService.findAll(query, userId, userRole);
  }

  /**************************************
   * GET TASKS BY EVENT ENDPOINT
   **************************************/
  @GetEventTasksSwagger()
  @Get('events/:eventId')
  getEventTasks(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
    @Query() query: TaskQueryDto,
  ) {
    return this.taskService.getEventTasks(eventId, userId, userRole, query);
  }

  /**************************************
   * GET MY TASKS ENDPOINT (FOR VOLUNTEERS)
   **************************************/
  @GetMyTasksSwagger()
  @Get('my-tasks')
  getMyTasks(@GetUser('id') userId: string, @Query() query: TaskQueryDto) {
    return this.taskService.getMyTasks(userId, query);
  }

  /**************************************
   * GET MY TASKS IN SPECIFIC EVENT (FOR VOLUNTEERS)
   **************************************/
  @GetMyEventTasksSwagger()
  @Get('events/:eventId/my-tasks')
  getMyEventTasks(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser('id') userId: string,
    @Query() query: TaskQueryDto,
  ) {
    return this.taskService.getMyEventTasks(eventId, userId, query);
  }

  /**************************************
   * GET AVAILABLE VOLUNTEERS FOR EVENT
   **************************************/
  @GetAvailableVolunteersSwagger()
  @Get('events/:eventId/volunteers')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN, SystemRole.USER)
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
  @GetTaskByIdSwagger()
  @Get(':id')
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
  @UpdateTaskSwagger()
  @Patch(':id')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN, SystemRole.USER)
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
  @DeleteTaskSwagger()
  @Delete(':id')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN, SystemRole.USER)
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
  @AssignTaskSwagger()
  @Post(':id/assign')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN, SystemRole.USER)
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
  @UpdateTaskAssignmentSwagger()
  @Patch('assignments/:assignmentId')
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
  @RemoveTaskAssignmentSwagger()
  @Delete('assignments/:assignmentId')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN, SystemRole.USER)
  removeAssignment(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.taskService.removeAssignment(assignmentId, userId, userRole);
  }
}
