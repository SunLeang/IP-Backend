import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { AssignmentModule } from './assignment/assignment.module';
import { PrismaModule } from 'src/app/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AssignmentModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
