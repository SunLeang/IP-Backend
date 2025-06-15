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
import { VolunteerService } from './services/volunteer.service';
import { CreateVolunteerApplicationDto } from './dto/create-volunteer-application.dto';
import { UpdateVolunteerApplicationDto } from './dto/update-volunteer-application.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/core/guards/roles.guard';
import { GetUser } from 'src/app/core/decorators/get-user.decorator';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { SystemRole, EventStatus } from '@prisma/client';

// Import Swagger decorators
import {
  VolunteerControllerSwagger,
  ApplyForEventSwagger,
  GetEventApplicationsSwagger,
  GetMyApplicationsSwagger,
  GetApplicationByIdSwagger,
  UpdateApplicationStatusSwagger,
  GetEventVolunteersSwagger,
  RemoveVolunteerSwagger,
  GetDashboardStatsSwagger,
  GetVolunteerHistorySwagger,
} from './decorators/swagger';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/
@VolunteerControllerSwagger()
@Controller('volunteer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  /**************************************
   * APPLICATION OPERATIONS
   **************************************/

  @ApplyForEventSwagger()
  @Post('applications')
  async applyForEvent(
    @Body() createDto: CreateVolunteerApplicationDto,
    @GetUser('id') userId: string,
  ) {
    return this.volunteerService.createApplication(userId, createDto);
  }

  @GetEventApplicationsSwagger()
  @Get('event/:eventId/applications')
  async getEventApplications(
    @Param('eventId') eventId: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.volunteerService.getEventApplications(
      eventId,
      userId,
      userRole,
    );
  }

  @GetMyApplicationsSwagger()
  @Get('my-applications')
  async getMyApplications(@GetUser('id') userId: string) {
    return this.volunteerService.getUserApplications(userId);
  }

  @GetApplicationByIdSwagger()
  @Get('applications/:id')
  async getApplicationById(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.volunteerService.getApplicationById(id, userId, userRole);
  }

  @UpdateApplicationStatusSwagger()
  @Patch('applications/:id/status')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  async updateApplicationStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateVolunteerApplicationDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.volunteerService.updateApplicationStatus(
      id,
      updateDto,
      userId,
      userRole,
    );
  }

  /**************************************
   * VOLUNTEER MANAGEMENT OPERATIONS
   **************************************/

  @GetEventVolunteersSwagger()
  @Get('event/:eventId/volunteers')
  async getEventVolunteers(@Param('eventId') eventId: string) {
    return this.volunteerService.getEventVolunteers(eventId);
  }

  @RemoveVolunteerSwagger()
  @Delete('event/:eventId/volunteers/:volunteerId')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  async removeVolunteer(
    @Param('eventId') eventId: string,
    @Param('volunteerId') volunteerId: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.volunteerService.removeVolunteer(
      eventId,
      volunteerId,
      userId,
      userRole,
    );
  }

  /**************************************
   * DASHBOARD OPERATIONS
   **************************************/

  @GetDashboardStatsSwagger()
  @Get('dashboard/stats')
  async getDashboardStats(@GetUser('id') userId: string) {
    return this.volunteerService.getDashboardStats(userId);
  }

  /**************************************
   * VOLUNTEER HISTORY OPERATIONS
   **************************************/

  @GetVolunteerHistorySwagger()
  @Get('history')
  async getVolunteerHistory(
    @GetUser('id') userId: string,
    @Query('status') status?: string, // Change from EventStatus to string for validation
    @Query('search') search?: string,
  ) {
    // Validate and convert status
    let validStatus: EventStatus | undefined;
    if (status && Object.values(EventStatus).includes(status as EventStatus)) {
      validStatus = status as EventStatus;
    }

    return this.volunteerService.getVolunteerHistory(userId, {
      status: validStatus,
      search: search && search !== 'undefined' ? search : undefined,
    });
  }

  /**************************************
   * VOLUNTEER HISTORY DETAIL
   **************************************/

  @Get('history/:eventId')
  async getVolunteerHistoryDetail(
    @GetUser('id') userId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.volunteerService.getVolunteerHistoryDetail(userId, eventId);
  }
}
