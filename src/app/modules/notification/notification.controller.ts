import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Notification } from '@prisma/client';

// Import Swagger decorators
import {
  NotificationControllerSwagger,
  GetAllNotificationsSwagger,
  GetNotificationByIdSwagger,
  GetUnreadCountSwagger,
  MarkNotificationAsReadSwagger,
  MarkAllNotificationsAsReadSwagger,
} from './decorators/swagger';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/
@NotificationControllerSwagger()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**************************************
   * READ OPERATIONS
   **************************************/

  @GetAllNotificationsSwagger()
  @Get()
  async findAll(@Request() req): Promise<Notification[]> {
    return this.notificationService.findAll(req.user.id);
  }

  @GetNotificationByIdSwagger()
  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Notification> {
    return this.notificationService.findOne(id, req.user.id);
  }

  @GetUnreadCountSwagger()
  @Get('unread-count')
  async getUnreadCount(@Request() req): Promise<{ count: number }> {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  /**************************************
   * UPDATE OPERATIONS
   **************************************/

  @MarkNotificationAsReadSwagger()
  @Patch(':id/read')
  async markAsRead(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Notification> {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @MarkAllNotificationsAsReadSwagger()
  @Patch('mark-all-read')
  async markAllAsRead(@Request() req): Promise<{ count: number }> {
    return this.notificationService.markAllAsRead(req.user.id);
  }
}