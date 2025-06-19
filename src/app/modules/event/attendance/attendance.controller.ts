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
  CheckAttendanceStatusSwagger,
} from './decorators/swagger';

@AttendanceControllerSwagger()
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**************************************
   * ✅ POST ROUTES FIRST
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

  @BulkCheckInSwagger()
  @Post('event/:eventId/bulk-check-in')
  bulkCheckIn(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body('userIds') userIds: string[],
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    console.log(`🎯 ROUTE HIT: bulkCheckIn - Event: ${eventId}`);
    return this.attendanceService.bulkCheckIn(
      eventId,
      userIds,
      userId,
      userRole,
    );
  }

  /**************************************
   * ✅ MOST SPECIFIC GET ROUTES FIRST
   **************************************/

  // ✅ CRITICAL: This MUST come before any generic routes
  @CheckAttendanceStatusSwagger()
  @Get('check/:eventId')
  @UseGuards(JwtAuthGuard) // Only JWT auth required, no role restrictions
  checkAttendanceStatus(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser('id') userId: string,
  ) {
    console.log(
      `🎯 ROUTE HIT: checkAttendanceStatus - User: ${userId}, Event: ${eventId}`,
    );
    return this.attendanceService.checkAttendanceStatus(userId, eventId);
  }

  @GetEventAttendeesSwagger()
  @Get('event/:eventId')
  findAllByEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query() query: AttendanceQueryDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    console.log(`🎯 ROUTE HIT: findAllByEvent - Event: ${eventId}`);
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
    console.log(`🎯 ROUTE HIT: getEventAttendanceStats - Event: ${eventId}`);
    return this.attendanceService.getEventAttendanceStats(
      eventId,
      userId,
      userRole,
    );
  }

  /**************************************
   * ✅ COMPOSITE KEY ROUTES (More specific than :id)
   **************************************/

  @GetAttendanceByCompositeIdSwagger()
  @Get(':userId/:eventId')
  findByCompositeKey(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @GetUser('id') currentUserId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    console.log(
      `🎯 ROUTE HIT: findByCompositeKey - User: ${userId}, Event: ${eventId}`,
    );
    return this.attendanceService.findOne(
      `${userId}:${eventId}`,
      currentUserId,
      userRole,
    );
  }

  @UpdateAttendanceByCompositeIdSwagger()
  @Patch(':userId/:eventId')
  updateByCompositeKey(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @GetUser('id') currentUserId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    console.log(
      `🎯 ROUTE HIT: updateByCompositeKey - User: ${userId}, Event: ${eventId}`,
    );
    return this.attendanceService.update(
      `${userId}:${eventId}`,
      updateAttendanceDto,
      currentUserId,
      userRole,
    );
  }

  @DeleteAttendanceByCompositeIdSwagger()
  @Delete(':userId/:eventId')
  removeByCompositeKey(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @GetUser('id') currentUserId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    console.log(
      `🎯 ROUTE HIT: removeByCompositeKey - User: ${userId}, Event: ${eventId}`,
    );
    return this.attendanceService.remove(
      `${userId}:${eventId}`,
      currentUserId,
      userRole,
    );
  }

  /**************************************
   * ✅ GENERIC ROUTES LAST (These will catch anything that doesn't match above)
   **************************************/

  @GetAttendanceByIdSwagger()
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    console.log(`🎯 ROUTE HIT: findOne (generic) - ID: ${id}`);
    return this.attendanceService.findOne(id, userId, userRole);
  }

  @UpdateAttendanceByIdSwagger()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    console.log(`🎯 ROUTE HIT: update (generic) - ID: ${id}`);
    return this.attendanceService.update(
      id,
      updateAttendanceDto,
      userId,
      userRole,
    );
  }

  @DeleteAttendanceByIdSwagger()
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    console.log(`🎯 ROUTE HIT: remove (generic) - ID: ${id}`);
    return this.attendanceService.remove(id, userId, userRole);
  }
}
