import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/core/guards/roles.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() data: Prisma.TaskCreateInput) {
    return this.taskService.createTask(data);
  }

  @Get('/')
  @ApiResponse({ status: 403, description: 'Forbidden resource' })
  findAll() {
    return this.taskService.getAllTasks();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.getTaskById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Prisma.TaskUpdateInput) {
    return this.taskService.updateTask(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.deleteTask(id);
  }
}
