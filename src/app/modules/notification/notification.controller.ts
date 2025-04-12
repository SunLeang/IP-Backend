import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Patch, 
    Param, 
    Delete, 
    UseGuards,
    Request,
    ParseUUIDPipe
  } from '@nestjs/common';
  import { NotificationService } from './notification.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { Notification } from '@prisma/client';
  import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
  
  @ApiTags('notifications')
  @Controller('notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}
  
    @ApiOperation({ summary: 'Get all notifications for current user' })
    @ApiResponse({ status: 200, description: 'Return all notifications' })
    @Get()
    async findAll(@Request() req): Promise<Notification[]> {
      return this.notificationService.findAll(req.user.userId);
    }
  
    @ApiOperation({ summary: 'Get notification by id' })
    @ApiResponse({ status: 200, description: 'Return notification by id' })
    @ApiResponse({ status: 404, description: 'Notification not found' })
    @Get(':id')
    async findOne(
      @Request() req,
      @Param('id', ParseUUIDPipe) id: string,
    ): Promise<Notification> {
      return this.notificationService.findOne(id, req.user.userId);
    }
  
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiResponse({ status: 200, description: 'The notification has been marked as read' })
    @ApiResponse({ status: 404, description: 'Notification not found' })
    @Patch(':id/read')
    async markAsRead(
      @Request() req,
      @Param('id', ParseUUIDPipe) id: string,
    ): Promise<Notification> {
      return this.notificationService.markAsRead(id, req.user.userId);
    }
  
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiResponse({ status: 200, description: 'All notifications have been marked as read' })
    @Patch('mark-all-read')
    async markAllAsRead(@Request() req): Promise<{ count: number }> {
      return this.notificationService.markAllAsRead(req.user.userId);
    }
  
    @ApiOperation({ summary: 'Get unread notification count' })
    @ApiResponse({ status: 200, description: 'Return unread notification count' })
    @Get('unread-count')
    async getUnreadCount(@Request() req): Promise<{ count: number }> {
      return this.notificationService.getUnreadCount(req.user.userId);
    }
  }