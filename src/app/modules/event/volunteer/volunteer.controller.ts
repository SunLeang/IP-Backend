// src/app/modules/volunteer/volunteer.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { VolunteerService } from './volunteer.service';
import { CreateVolunteerApplicationDto } from './dto/create-volunteer-application.dto';
import { UpdateVolunteerApplicationDto } from './dto/update-volunteer-application.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/core/guards/roles.guard';
import { GetUser } from 'src/app/core/decorators/get-user.decorator';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('volunteer')
@Controller('volunteer')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  @Post('applications')
  @ApiOperation({ summary: 'Apply to be a volunteer for an event' })
  @ApiResponse({ status: 201, description: 'The application has been created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Already applied' })
  async applyForEvent(
    @Body() createDto: CreateVolunteerApplicationDto,
    @GetUser('id') userId: string,
  ) {
    return this.volunteerService.createApplication(userId, createDto);
  }

  @Get('event/:eventId/applications')
  @ApiOperation({ summary: 'Get all volunteer applications for an event' })
  @ApiResponse({
    status: 200,
    description: 'Return all applications for the event',
  })
  @ApiResponse({ status: 403, description: 'Forbidden resource' })
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

  @Get('my-applications')
  @ApiOperation({ summary: 'Get all my volunteer applications' })
  @ApiResponse({
    status: 200,
    description: 'Return all applications for the current user',
  })
  async getMyApplications(@GetUser('id') userId: string) {
    return this.volunteerService.getUserApplications(userId);
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Get a volunteer application by ID' })
  @ApiResponse({ status: 200, description: 'Return the application' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async getApplicationById(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.volunteerService.getApplicationById(id, userId, userRole);
  }

  @Patch('applications/:id/status')
  @ApiOperation({ summary: 'Update volunteer application status' })
  @ApiResponse({
    status: 200,
    description: 'The application status has been updated',
  })
  @ApiResponse({ status: 403, description: 'Forbidden resource' })
  @ApiResponse({ status: 404, description: 'Application not found' })
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

  @Get('event/:eventId/volunteers')
  @ApiOperation({ summary: 'Get all volunteers for an event' })
  @ApiResponse({
    status: 200,
    description: 'Return all approved volunteers for the event',
  })
  async getEventVolunteers(@Param('eventId') eventId: string) {
    return this.volunteerService.getEventVolunteers(eventId);
  }

  @Delete('event/:eventId/volunteers/:volunteerId')
  @ApiOperation({ summary: 'Remove a volunteer from an event' })
  @ApiResponse({ status: 200, description: 'The volunteer has been removed' })
  @ApiResponse({ status: 403, description: 'Forbidden resource' })
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
}
