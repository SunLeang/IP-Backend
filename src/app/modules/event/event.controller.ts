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
  import { EventService } from './event.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
  import { Event as EventModel, EventStatus, SystemRole } from '@prisma/client';
  import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
  import { Roles } from 'src/app/core/decorators/roles.decorator';
  import { RolesGuard } from 'src/app/core/guards/roles.guard';
  
  @ApiTags('events')
  @Controller('events')
  export class EventController {
    constructor(private readonly eventService: EventService) {}
  
    @ApiOperation({ summary: 'Get all events' })
    @ApiResponse({ status: 200, description: 'Return all events' })
    @Get()
    async findAll(): Promise<EventModel[]> {
      return this.eventService.findAll();
    }
  
    @ApiOperation({ summary: 'Get upcoming events' })
    @ApiResponse({ status: 200, description: 'Return upcoming events' })
    @Get('upcoming')
    async findUpcoming(): Promise<EventModel[]> {
      return this.eventService.findUpcoming();
    }
  
    @ApiOperation({ summary: 'Get events by organizer' })
    @ApiResponse({ status: 200, description: 'Return events by organizer' })
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('my-events')
    async findMyEvents(@Request() req): Promise<EventModel[]> {
      return this.eventService.findByOrganizer(req.user.userId);
    }
  
    @ApiOperation({ summary: 'Get an event by id' })
    @ApiResponse({ status: 200, description: 'Return an event by id' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<EventModel> {
      return this.eventService.findOne(id);
    }
  
    @ApiOperation({ summary: 'Create a new event' })
    @ApiResponse({ status: 201, description: 'The event has been successfully created' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
    @ApiBearerAuth()
    @Post()
    async create(
      @Request() req,
      @Body() createEventDto: CreateEventDto
    ): Promise<EventModel> {
      return this.eventService.create(req.user.userId, createEventDto);
    }
  
    @ApiOperation({ summary: 'Update an event' })
    @ApiResponse({ status: 200, description: 'The event has been successfully updated' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
    @ApiBearerAuth()
    @Patch(':id')
    async update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateEventDto: UpdateEventDto,
    ): Promise<EventModel> {
      return this.eventService.update(id, updateEventDto);
    }
  
    @ApiOperation({ summary: 'Delete an event' })
    @ApiResponse({ status: 200, description: 'The event has been successfully deleted' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<EventModel> {
      return this.eventService.softDelete(id);
    }
  
    @ApiOperation({ summary: 'Publish an event' })
    @ApiResponse({ status: 200, description: 'The event has been successfully published' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
    @ApiBearerAuth()
    @Patch(':id/publish')
    async publish(@Param('id', ParseUUIDPipe) id: string): Promise<EventModel> {
      return this.eventService.updateStatus(id, EventStatus.PUBLISHED);
    }
  
    @ApiOperation({ summary: 'Cancel an event' })
    @ApiResponse({ status: 200, description: 'The event has been successfully cancelled' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
    @ApiBearerAuth()
    @Patch(':id/cancel')
    async cancel(@Param('id', ParseUUIDPipe) id: string): Promise<EventModel> {
      return this.eventService.updateStatus(id, EventStatus.CANCELLED);
    }
  }