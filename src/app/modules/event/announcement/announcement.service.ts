import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { SystemRole } from '@prisma/client';
import { NotificationService } from '../../notification/notification.service';

@Injectable()
export class AnnouncementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a new announcement and notify all relevant users
   */
  async create(
    createAnnouncementDto: CreateAnnouncementDto,
    userId: string,
    userRole: SystemRole,
  ) {
    const { eventId, title, description, image } = createAnnouncementDto;

    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check if user is event organizer or admin
    if (event.organizerId !== userId && userRole === SystemRole.USER) {
      throw new ForbiddenException(
        'Only event organizers or admins can create announcements',
      );
    }

    // Create announcement
    const announcement = await this.prisma.announcement.create({
      data: {
        title,
        description,
        image,
        event: { connect: { id: eventId } },
      },
    });

    // Notify all users related to the event
    await this.notificationService.notifyAllEventUsers(
      eventId,
      announcement.id,
      `New announcement for ${event.name}: ${title}`,
    );

    return announcement;
  }

  /**
   * Get all announcements for an event
   */
  async findAllByEvent(eventId: string) {
    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return this.prisma.announcement.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific announcement by ID
   */
  async findOne(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            organizerId: true,
          },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    return announcement;
  }

  /**
   * Update an announcement
   */
  async update(
    id: string,
    updateAnnouncementDto: UpdateAnnouncementDto,
    userId: string,
    userRole: SystemRole,
  ) {
    const announcement = await this.findOne(id);

    // Check if user is event organizer or admin
    if (
      announcement.event.organizerId !== userId &&
      userRole === SystemRole.USER
    ) {
      throw new ForbiddenException(
        'Only event organizers or admins can update announcements',
      );
    }

    // Update announcement
    const updatedAnnouncement = await this.prisma.announcement.update({
      where: { id },
      data: updateAnnouncementDto,
    });

    // Notify all users about the update if title or description changed
    if (updateAnnouncementDto.title || updateAnnouncementDto.description) {
      await this.notificationService.notifyAllEventUsers(
        announcement.event.id,
        announcement.id,
        `Announcement updated for ${announcement.event.name}: ${
          updatedAnnouncement.title
        }`,
      );
    }

    return updatedAnnouncement;
  }

  /**
   * Delete an announcement
   */
  async remove(id: string, userId: string, userRole: SystemRole) {
    const announcement = await this.findOne(id);

    // Check if user is event organizer or admin
    if (
      announcement.event.organizerId !== userId &&
      userRole === SystemRole.USER
    ) {
      throw new ForbiddenException(
        'Only event organizers or admins can delete announcements',
      );
    }

    return this.prisma.announcement.delete({
      where: { id },
    });
  }
}
