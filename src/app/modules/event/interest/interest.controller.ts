import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { InterestService } from './interest.service';
import { CreateInterestDto } from './dto/create-interest.dto';
import { InterestQueryDto } from './dto/interest-query.dto';
import { GetUser } from '../../../core/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { SystemRole } from '@prisma/client';

@ApiTags('interests')
@Controller('interests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InterestController {
  constructor(private readonly interestService: InterestService) {}

  /**************************************
   * ADD EVENT TO INTERESTS ENDPOINT
   **************************************/
  @Post()
  // Swagger documentation
  @ApiOperation({ summary: "Add an event to user's interests" })
  @ApiResponse({ status: 201, description: 'Event added to interests' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 409, description: 'Already interested in this event' })
  @ApiBody({
    type: CreateInterestDto,
    description: 'Event interest data',
  })
  // Controller logic
  addInterest(
    @GetUser('id') userId: string,
    @Body() createInterestDto: CreateInterestDto,
  ) {
    return this.interestService.addInterest(userId, createInterestDto);
  }

  /**************************************
   * REMOVE EVENT FROM INTERESTS ENDPOINT
   **************************************/
  @Delete('event/:eventId')
  // Swagger documentation
  @ApiOperation({ summary: "Remove an event from user's interests" })
  @ApiResponse({ status: 200, description: 'Event removed from interests' })
  @ApiResponse({ status: 404, description: 'Interest record not found' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  // Controller logic
  removeInterest(
    @GetUser('id') userId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.interestService.removeInterest(userId, eventId);
  }

  /**************************************
   * GET USER'S INTERESTED EVENTS ENDPOINT
   **************************************/
  @Get('my-interests')
  // Swagger documentation
  @ApiOperation({ summary: 'Get all events user is interested in' })
  @ApiResponse({ status: 200, description: 'Return list of interested events' })
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
  // Controller logic
  getUserInterests(
    @GetUser('id') userId: string,
    @Query() query: InterestQueryDto,
  ) {
    return this.interestService.getUserInterests(userId, query);
  }

  /**************************************
   * GET EVENT'S INTERESTED USERS ENDPOINT
   **************************************/
  @Get('event/:eventId/users')
  // Swagger documentation
  @ApiOperation({ summary: 'Get all users interested in an event' })
  @ApiResponse({ status: 200, description: 'Return list of interested users' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
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
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search users by name or email',
  })
  // Controller logic
  getEventInterestedUsers(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
    @Query() query: InterestQueryDto,
  ) {
    return this.interestService.getEventInterestedUsers(
      eventId,
      userId,
      userRole,
      query,
    );
  }

  /**************************************
   * CHECK USER INTEREST STATUS ENDPOINT
   **************************************/
  @Get('check/:eventId')
  // Swagger documentation
  @ApiOperation({ summary: 'Check if user is interested in an event' })
  @ApiResponse({ status: 200, description: 'Return interest status' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  // Controller logic
  checkUserInterest(
    @GetUser('id') userId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.interestService.checkUserInterest(userId, eventId);
  }
}
