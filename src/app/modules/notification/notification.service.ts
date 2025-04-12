import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { Notification, NotificationType } from '@prisma/client';
import { CreateNotificationDto, UpdateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async create(data: CreateNotificationDto): Promise<Notification> {
    return this.prisma.notification.create({
      data,
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    await this.findOne(id, userId); // Check if notification exists and belongs to user
    
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { 
        userId,
        read: false,
      },
      data: { read: true },
    });

    return { count: result.count };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return { count };
  }

  async createEventNotification(
    userId: string,
    eventId: string,
    type: NotificationType,
    message: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      eventId,
      type,
      message,
    });
  }
}