import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { GetUser } from '../../../core/decorators/get-user.decorator';
import { SystemRole } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  /**************************************
   * CREATE ANNOUNCEMENT ENDPOINT
   **************************************/
  @Post()
  // Swagger documentation
  @ApiOperation({ summary: 'Create a new announcement' })
  @ApiResponse({
    status: 201,
    description: 'The announcement has been created',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiBody({ type: CreateAnnouncementDto })
  // Controller logic
  create(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.announcementService.create(
      createAnnouncementDto,
      userId,
      userRole,
    );
  }

  /**************************************
   * GET EVENT ANNOUNCEMENTS ENDPOINT
   **************************************/
  @Get('event/:eventId')
  // Swagger documentation
  @ApiOperation({ summary: 'Get all announcements for an event' })
  @ApiResponse({
    status: 200,
    description: 'Return all announcements for the event',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  // Controller logic
  findAllByEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.announcementService.findAllByEvent(eventId);
  }

  /**************************************
   * GET ANNOUNCEMENT BY ID ENDPOINT
   **************************************/
  @Get(':id')
  // Swagger documentation
  @ApiOperation({ summary: 'Get announcement by ID' })
  @ApiResponse({ status: 200, description: 'Return the announcement' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  @ApiParam({ name: 'id', description: 'Announcement ID' })
  // Controller logic
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.announcementService.findOne(id);
  }

  /**************************************
   * UPDATE ANNOUNCEMENT ENDPOINT
   **************************************/
  @Patch(':id')
  // Swagger documentation
  @ApiOperation({ summary: 'Update an announcement' })
  @ApiResponse({
    status: 200,
    description: 'The announcement has been updated',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  @ApiParam({ name: 'id', description: 'Announcement ID' })
  @ApiBody({ type: UpdateAnnouncementDto })
  // Controller logic
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.announcementService.update(
      id,
      updateAnnouncementDto,
      userId,
      userRole,
    );
  }

  /**************************************
   * DELETE ANNOUNCEMENT ENDPOINT
   **************************************/
  @Delete(':id')
  // Swagger documentation
  @ApiOperation({ summary: 'Delete an announcement' })
  @ApiResponse({
    status: 200,
    description: 'The announcement has been deleted',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  @ApiParam({ name: 'id', description: 'Announcement ID' })
  // Controller logic
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.announcementService.remove(id, userId, userRole);
  }
}
