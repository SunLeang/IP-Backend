import { Injectable } from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { AssignTaskDto } from '../dto/assign-task.dto';
import { CreateTaskDto } from '../dto/create-task.dto';
import { TaskQueryDto } from '../dto/task-query.dto';
import { UpdateTaskAssignmentDto } from '../dto/update-task-assignment.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskAssignmentService } from './task-assignment.service';
import { TaskCoreService } from './task-core.service';
import { TaskQueryService } from './task-query.service';


@Injectable()
export class TaskService {
  constructor(
    private readonly coreService: TaskCoreService,
    private readonly queryService: TaskQueryService,
    private readonly assignmentService: TaskAssignmentService,
  ) {}

  /**************************************
   * CREATE OPERATIONS (DELEGATED)
   **************************************/

  async create(
    createTaskDto: CreateTaskDto,
    userId: string,
    userRole: SystemRole,
  ) {
    return this.coreService.create(createTaskDto, userId, userRole);
  }

  /**************************************
   * QUERY OPERATIONS (DELEGATED)
   **************************************/

  async findAll(query: TaskQueryDto, userId: string, userRole: SystemRole) {
    return this.queryService.findAll(query, userId, userRole);
  }

  async getMyTasks(userId: string, query: TaskQueryDto) {
    return this.queryService.getMyTasks(userId, query);
  }

  async findOne(id: string, userId: string, userRole: SystemRole) {
    return this.queryService.findOne(id, userId, userRole);
  }

  async getAvailableVolunteers(
    eventId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    return this.queryService.getAvailableVolunteers(eventId, userId, userRole);
  }

  /**************************************
   * UPDATE OPERATIONS (DELEGATED)
   **************************************/

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
    userRole: SystemRole,
  ) {
    return this.coreService.update(id, updateTaskDto, userId, userRole);
  }

  /**************************************
   * DELETE OPERATIONS (DELEGATED)
   **************************************/

  async remove(id: string, userId: string, userRole: SystemRole) {
    return this.coreService.remove(id, userId, userRole);
  }

  /**************************************
   * ASSIGNMENT OPERATIONS (DELEGATED)
   **************************************/

  async assignTask(
    taskId: string,
    assignTaskDto: AssignTaskDto,
    userId: string,
    userRole: SystemRole,
  ) {
    return this.assignmentService.assignTask(
      taskId,
      assignTaskDto,
      userId,
      userRole,
    );
  }

  async updateAssignment(
    assignmentId: string,
    updateDto: UpdateTaskAssignmentDto,
    userId: string,
    userRole: SystemRole,
  ) {
    return this.assignmentService.updateAssignment(
      assignmentId,
      updateDto,
      userId,
      userRole,
    );
  }

  async removeAssignment(
    assignmentId: string,
    userId: string,
    userRole: SystemRole,
  ) {
    return this.assignmentService.removeAssignment(
      assignmentId,
      userId,
      userRole,
    );
  }
}
