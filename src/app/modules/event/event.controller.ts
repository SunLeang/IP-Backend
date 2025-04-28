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
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/core/guards/roles.guard';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { Public } from 'src/app/core/decorators/public.decorator';
import { GetUser } from 'src/app/core/decorators/get-user.decorator';
import { EventStatus, SystemRole } from '@prisma/client';
import { PrismaService } from 'src/app/prisma/services/prisma.service';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  create(
    @Body() createEventDto: CreateEventDto,
    @GetUser('id') userId: string,
  ) {
    return this.eventService.create(createEventDto, userId);
  }

  @Get()
  @Public()
  findAll(@Query() query: any) {
    return this.eventService.findAll(query);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.eventService.update(id, updateEventDto, userId, userRole);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.eventService.remove(id, userId, userRole);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: EventStatus,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.eventService.updateStatus(id, status, userId, userRole);
  }

  @Patch(':id/volunteers/toggle')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  async toggleVolunteerApplications(
    @Param('id') id: string,
    @Body('acceptingVolunteers') acceptingVolunteers: boolean,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.eventService.toggleVolunteerApplications(
      id,
      acceptingVolunteers,
      userId,
      userRole,
    );
  }

  @Get('organizer/:organizerId')
  getEventsByOrganizer(@Param('organizerId') organizerId: string) {
    return this.eventService.getEventsByOrganizer(organizerId);
  }

  @Get('admin/dashboard')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  async adminDashboard() {
    const [upcomingEvents, pastEvents, categories, totalEvents] =
      await Promise.all([
        this.eventService.findAll({
          status: EventStatus.PUBLISHED,
          dateTime: { gte: new Date() },
          take: 5,
        }),
        this.eventService.findAll({
          status: EventStatus.COMPLETED,
          take: 5,
        }),
        this.prisma.eventCategory.findMany({
          include: {
            _count: {
              select: {
                events: true,
              },
            },
          },
        }),
        this.prisma.event.count({
          where: { deletedAt: null },
        }),
      ]);

    return {
      upcomingEvents: upcomingEvents.data,
      pastEvents: pastEvents.data,
      categories,
      stats: {
        totalEvents,
        // ...
      },
    };
  }

  // Get attendees for an event
  @Get(':id/attendees')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  async getEventAttendees(@Param('id') id: string) {
    return this.eventService.getEventAttendees(id);
  }

  // Get volunteers for an event
  @Get(':id/volunteers')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  async getEventVolunteers(@Param('id') id: string) {
    return this.eventService.getEventVolunteers(id);
  }
}
