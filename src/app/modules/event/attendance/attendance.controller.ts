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
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { GetUser } from '../../../core/decorators/get-user.decorator';
import { SystemRole } from '@prisma/client';
import { AttendanceService } from './services/attandance.service';

// Import Swagger decorators
import {
  AttendanceControllerSwagger,
  RegisterAttendeeSwagger,
  GetEventAttendeesSwagger,
  GetEventAttendanceStatsSwagger,
  GetAttendanceByCompositeIdSwagger,
  GetAttendanceByIdSwagger,
  UpdateAttendanceByCompositeIdSwagger,
  UpdateAttendanceByIdSwagger,
  DeleteAttendanceByCompositeIdSwagger,
  DeleteAttendanceByIdSwagger,
  BulkCheckInSwagger,
} from './decorators/swagger';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/
@AttendanceControllerSwagger()
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**************************************
   * REGISTRATION OPERATIONS
   **************************************/

  @RegisterAttendeeSwagger()
  @Post()
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
   * QUERY OPERATIONS
   **************************************/

  @GetEventAttendeesSwagger()
  @Get('event/:eventId')
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

  @GetEventAttendanceStatsSwagger()
  @Get('event/:eventId/stats')
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

  @GetAttendanceByCompositeIdSwagger()
  @Get(':userId/:eventId')
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

  @GetAttendanceByIdSwagger()
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.attendanceService.findOne(id, userId, userRole);
  }

  /**************************************
   * UPDATE OPERATIONS
   **************************************/

  @UpdateAttendanceByCompositeIdSwagger()
  @Patch(':userId/:eventId')
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

  @UpdateAttendanceByIdSwagger()
  @Patch(':id')
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
   * DELETE OPERATIONS
   **************************************/

  @DeleteAttendanceByCompositeIdSwagger()
  @Delete(':userId/:eventId')
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

  @DeleteAttendanceByIdSwagger()
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.attendanceService.remove(id, userId, userRole);
  }

  /**************************************
   * BULK OPERATIONS
   **************************************/

  @BulkCheckInSwagger()
  @Post('event/:eventId/bulk-check-in')
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
