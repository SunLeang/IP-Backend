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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/core/guards/roles.guard';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { Public } from 'src/app/core/decorators/public.decorator';
import { GetUser } from 'src/app/core/decorators/get-user.decorator';
import { EventStatus, SystemRole } from '@prisma/client';

// Import DTOs
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

// Import services
import { EventService } from './services/event.service';
import { EventQueryService } from './services/event-query.service';
import { EventAdminService } from './services/event-admin.service';
import { EventAnalyticsService } from './services/dashboard/event-analytics.service';

// Import Swagger decorators
import {
  EventControllerSwagger,
  CreateEventSwagger,
  FindAllEventsSwagger,
  FindOneEventSwagger,
  UpdateEventSwagger,
  RemoveEventSwagger,
  UpdateEventStatusSwagger,
  ToggleVolunteerApplicationsSwagger,
  GetEventsByOrganizerSwagger,
  GetEventAttendeesSwagger,
  GetEventVolunteersSwagger,
} from './decorators/swagger';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/
@EventControllerSwagger()
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly eventQueryService: EventQueryService,
    private readonly eventAdminService: EventAdminService,
    private readonly eventAnalyticsService: EventAnalyticsService,
  ) {}

  @CreateEventSwagger()
  @Post()
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  create(
    @Body() createEventDto: CreateEventDto,
    @GetUser('id') userId: string,
  ) {
    return this.eventService.create(createEventDto, userId);
  }

  @FindAllEventsSwagger()
  @Get()
  @Public()
  findAll(@Query() query: any) {
    return this.eventQueryService.findAll(query);
  }

  @FindOneEventSwagger()
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @UpdateEventSwagger()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.eventAdminService.updateWithPermissions(
      id,
      updateEventDto,
      userId,
      userRole,
    );
  }

  @RemoveEventSwagger()
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.eventAdminService.removeWithPermissions(id, userId, userRole);
  }

  @UpdateEventStatusSwagger()
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: EventStatus,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.eventAdminService.updateStatusWithPermissions(
      id,
      status,
      userId,
      userRole,
    );
  }

  @ToggleVolunteerApplicationsSwagger()
  @Patch(':id/volunteers/toggle')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  toggleVolunteerApplications(
    @Param('id') id: string,
    @Body('acceptingVolunteers') acceptingVolunteers: boolean,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.eventAdminService.toggleVolunteerApplicationsWithPermissions(
      id,
      acceptingVolunteers,
      userId,
      userRole,
    );
  }

  @GetEventsByOrganizerSwagger()
  @Get('organizer/:organizerId')
  getEventsByOrganizer(@Param('organizerId') organizerId: string) {
    return this.eventAnalyticsService.getEventsByOrganizer(organizerId);
  }

  @GetEventAttendeesSwagger()
  @Get(':id/attendees')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  getEventAttendees(@Param('id') id: string) {
    return this.eventAdminService.getEventAttendees(id);
  }

  @GetEventVolunteersSwagger()
  @Get(':id/volunteers')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  getEventVolunteers(@Param('id') id: string) {
    return this.eventAdminService.getEventVolunteers(id);
  }
}
