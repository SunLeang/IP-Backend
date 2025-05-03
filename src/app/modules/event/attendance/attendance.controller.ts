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
  ParseUUIDPipe,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
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
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**************************************
   * REGISTER ATTENDEE ENDPOINT
   **************************************/
  @Post()
  @ApiOperation({ summary: 'Register a new attendee for an event' })
  @ApiResponse({ status: 201, description: 'The attendee has been registered' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiBody({ type: CreateAttendanceDto })
  register(
    @Body() createAttendanceDto: CreateAttendanceDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.attendanceService.register(
      createAttendanceDto,
      userId,
      userRole,
    );
  }

  /**************************************
   * GET EVENT ATTENDEES ENDPOINT
   **************************************/
  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get all attendees for an event' })
  @ApiResponse({ status: 200, description: 'Return the list of attendees' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by attendance status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or email',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Pagination - records to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Pagination - records to take',
  })
  findAllByEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query() query: AttendanceQueryDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.attendanceService.findAllByEvent(
      eventId,
      query,
      userId,
      userRole,
    );
  }

  /**************************************
   * GET EVENT STATISTICS ENDPOINT
   **************************************/
  @Get('event/:eventId/stats')
  @ApiOperation({ summary: 'Get attendance statistics for an event' })
  @ApiResponse({ status: 200, description: 'Return attendance statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  getEventAttendanceStats(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.attendanceService.getEventAttendanceStats(
      eventId,
      userId,
      userRole,
    );
  }

  /**************************************
   * GET ATTENDANCE BY COMPOSITE ID
   **************************************/
  @Get(':userId/:eventId')
  @ApiOperation({ summary: 'Get attendance details by user ID and event ID' })
  @ApiResponse({ status: 200, description: 'Return the attendance details' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  findByCompositeKey(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @GetUser('id') currentUserId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.attendanceService.findOne(
      `${userId}:${eventId}`,
      currentUserId,
      userRole,
    );
  }

  /**************************************
   * GET ATTENDANCE BY SINGLE ID ENDPOINT
   **************************************/
  @Get(':id')
  @ApiOperation({ summary: 'Get attendance details by ID' })
  @ApiResponse({ status: 200, description: 'Return the attendance details' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  @ApiParam({ name: 'id', description: 'Attendance ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.attendanceService.findOne(id, userId, userRole);
  }

  /**************************************
   * UPDATE ATTENDANCE BY COMPOSITE ID
   **************************************/
  @Patch(':userId/:eventId')
  @ApiOperation({
    summary: 'Update attendance details by user ID and event ID',
  })
  @ApiResponse({ status: 200, description: 'The attendance has been updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiBody({ type: UpdateAttendanceDto })
  updateByCompositeKey(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @GetUser('id') currentUserId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.attendanceService.update(
      `${userId}:${eventId}`,
      updateAttendanceDto,
      currentUserId,
      userRole,
    );
  }

  /**************************************
   * UPDATE ATTENDANCE BY SINGLE ID
   **************************************/
  @Patch(':id')
  @ApiOperation({ summary: 'Update attendance details (check-in, etc.)' })
  @ApiResponse({ status: 200, description: 'The attendance has been updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  @ApiParam({ name: 'id', description: 'Attendance ID' })
  @ApiBody({ type: UpdateAttendanceDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.attendanceService.update(
      id,
      updateAttendanceDto,
      userId,
      userRole,
    );
  }

  /**************************************
   * DELETE ATTENDANCE BY COMPOSITE ID
   **************************************/
  @Delete(':userId/:eventId')
  @ApiOperation({
    summary: 'Remove an attendance record by user ID and event ID',
  })
  @ApiResponse({ status: 200, description: 'The attendance has been deleted' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only organizers & admins',
  })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  removeByCompositeKey(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @GetUser('id') currentUserId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.attendanceService.remove(
      `${userId}:${eventId}`,
      currentUserId,
      userRole,
    );
  }

  /**************************************
   * DELETE ATTENDANCE BY SINGLE ID
   **************************************/
  @Delete(':id')
  @ApiOperation({ summary: 'Remove an attendance record' })
  @ApiResponse({ status: 200, description: 'The attendance has been deleted' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only organizers & admins',
  })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  @ApiParam({ name: 'id', description: 'Attendance ID' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.attendanceService.remove(id, userId, userRole);
  }

  /**************************************
   * BULK CHECK-IN ENDPOINT
   **************************************/
  @Post('event/:eventId/bulk-check-in')
  @ApiOperation({ summary: 'Bulk check-in multiple attendees' })
  @ApiResponse({ status: 201, description: 'Attendees have been checked in' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of User IDs to check in',
          example: ['user-id-1', 'user-id-2', 'user-id-3'],
        },
      },
    },
  })
  bulkCheckIn(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body('userIds') userIds: string[],
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.attendanceService.bulkCheckIn(
      eventId,
      userIds,
      userId,
      userRole,
    );
  }
}
