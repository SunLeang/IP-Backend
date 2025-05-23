import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { Prisma, TaskStatus } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  createTask(data: Prisma.TaskCreateInput) {
    return this.prisma.task.create({ data });
  }

  getAllTasks() {
    return this.prisma.task.findMany({
      include: {
        event: true,
        assignments: true,
      },
    });
  }

  getTaskById(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        event: true,
        assignments: true,
      },
    });
  }

  updateTask(id: string, data: Prisma.TaskUpdateInput) {
    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  deleteTask(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
