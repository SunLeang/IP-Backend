import { Module } from '@nestjs/common';
import { TaskService } from './services/task.service';
import { TaskController } from './task.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { NotificationModule } from '../../notification/notification.module';

// Import specialized services
import { TaskCoreService } from './services/task-core.service';
import { TaskPermissionService } from './services/task-permission.service';
import { TaskQueryService } from './services/task-query.service';
import { TaskAssignmentService } from './services/task-assignment.service';
import { TaskNotificationService } from './services/task-notification.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskCoreService,
    TaskPermissionService,
    TaskQueryService,
    TaskAssignmentService,
    TaskNotificationService,
  ],
  exports: [
    TaskService,
    TaskCoreService,
    TaskPermissionService,
    TaskQueryService,
    TaskAssignmentService,
    TaskNotificationService,
  ],
})
export class TaskModule {}
