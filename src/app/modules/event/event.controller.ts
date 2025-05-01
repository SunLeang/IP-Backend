/**************************************
 * IMPORTS
 **************************************/
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/
@ApiTags('events') // Swagger documentation
@ApiBearerAuth() // Swagger documentation
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly prisma: PrismaService,
  ) {}

  /**************************************
   * CREATE EVENT ENDPOINT
   **************************************/
  // Swagger documentation
  @Post()
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'The event has been successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiBody({
    schema: {
      example: {
        name: 'Tech Conference 2025',
        description:
          'Annual technology conference featuring the latest innovations',
        dateTime: '2025-07-15T09:00:00Z',
        locationDesc: 'Convention Center, Downtown',
        locationImage: 'https://example.com/location.jpg',
        profileImage: 'https://example.com/profile.jpg',
        coverImage: 'https://example.com/cover.jpg',
        status: 'DRAFT',
        categoryId: 'your-category-id-here',
        acceptingVolunteers: false,
      },
    },
  })
  // Actual implementation logic
  create(
    @Body() createEventDto: CreateEventDto,
    @GetUser('id') userId: string,
  ) {
    return this.eventService.create(createEventDto, userId);
  }

  /**************************************
   * GET ALL EVENTS ENDPOINT
   **************************************/
  // Swagger documentation
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all events with optional filtering' })
  @ApiResponse({
    status: 200,
    description: 'Return all events matching the criteria',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EventStatus,
    description: 'Filter by event status',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in event name and description',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Number of records to skip for pagination',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Number of records to take for pagination',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description: 'Field to order by',
    example: 'dateTime',
  })
  @ApiQuery({
    name: 'orderDir',
    required: false,
    description: 'Direction to order by',
    example: 'desc',
  })
  // Actual implementation logic
  findAll(@Query() query: any) {
    return this.eventService.findAll(query);
  }

  /**************************************
   * GET EVENT BY ID ENDPOINT
   **************************************/
  // Swagger documentation
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Return the event data' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  // Actual implementation logic
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  /**************************************
   * UPDATE EVENT ENDPOINT
   **************************************/
  // Swagger documentation
  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({
    status: 200,
    description: 'The event has been successfully updated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not authorized to update this event',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiBody({
    schema: {
      example: {
        name: 'Updated Event Name',
        description: 'Updated event description',
        status: 'PUBLISHED',
      },
    },
  })
  // Actual implementation logic
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.eventService.update(id, updateEventDto, userId, userRole);
  }

  /**************************************
   * DELETE EVENT ENDPOINT
   **************************************/
  // Swagger documentation
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'The event has been successfully deleted',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not authorized to delete this event',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  // Actual implementation logic
  remove(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.eventService.remove(id, userId, userRole);
  }

  /**************************************
   * UPDATE EVENT STATUS ENDPOINT
   **************************************/
  // Swagger documentation
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update event status' })
  @ApiResponse({
    status: 200,
    description: 'The event status has been successfully updated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not authorized to update this event',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiBody({
    schema: {
      example: {
        status: 'PUBLISHED',
      },
    },
  })
  // Actual implementation logic
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: EventStatus,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.eventService.updateStatus(id, status, userId, userRole);
  }

  /**************************************
   * TOGGLE VOLUNTEER APPLICATIONS ENDPOINT
   **************************************/
  // Swagger documentation
  @Patch(':id/volunteers/toggle')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Toggle volunteer application acceptance for an event',
  })
  @ApiResponse({
    status: 200,
    description: 'The volunteer application status has been toggled',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not authorized to update this event',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiBody({
    schema: {
      example: {
        acceptingVolunteers: true,
      },
    },
  })
  // Actual implementation logic
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

  /**************************************
   * GET EVENTS BY ORGANIZER ENDPOINT
   **************************************/
  // Swagger documentation
  @Get('organizer/:organizerId')
  @ApiOperation({ summary: 'Get all events organized by a specific user' })
  @ApiResponse({
    status: 200,
    description: 'Return all events for the organizer',
  })
  @ApiParam({ name: 'organizerId', description: 'Organizer user ID' })
  // Actual implementation logic
  getEventsByOrganizer(@Param('organizerId') organizerId: string) {
    return this.eventService.getEventsByOrganizer(organizerId);
  }

  /**************************************
   * ADMIN DASHBOARD ENDPOINT
   **************************************/
  // Swagger documentation
  @Get('admin/dashboard')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard data' })
  @ApiResponse({ status: 200, description: 'Return dashboard data' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  // Actual implementation logic
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
      },
    };
  }

  /**************************************
   * GET EVENT ATTENDEES ENDPOINT
   **************************************/
  // Swagger documentation
  @Get(':id/attendees')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all attendees for an event' })
  @ApiResponse({ status: 200, description: 'Return all event attendees' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  // Actual implementation logic
  async getEventAttendees(@Param('id') id: string) {
    return this.eventService.getEventAttendees(id);
  }

  /**************************************
   * GET EVENT VOLUNTEERS ENDPOINT
   **************************************/
  // Swagger documentation
  @Get(':id/volunteers')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all volunteers for an event' })
  @ApiResponse({ status: 200, description: 'Return all event volunteers' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin access required',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  // Actual implementation logic
  async getEventVolunteers(@Param('id') id: string) {
    return this.eventService.getEventVolunteers(id);
  }
}
