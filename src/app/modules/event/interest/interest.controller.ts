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
import { InterestService } from './interest.service';
import { CreateInterestDto } from './dto/create-interest.dto';
import { InterestQueryDto } from './dto/interest-query.dto';
import { GetUser } from '../../../core/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { SystemRole } from '@prisma/client';

// Import Swagger decorators
import {
  InterestControllerSwagger,
  AddInterestSwagger,
  RemoveInterestSwagger,
  GetUserInterestsSwagger,
  GetEventInterestedUsersSwagger,
  CheckUserInterestSwagger,
} from './decorators/swagger';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/
@InterestControllerSwagger()
@Controller('interests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterestController {
  constructor(private readonly interestService: InterestService) {}

  /**************************************
   * CREATE OPERATIONS
   **************************************/

  @AddInterestSwagger()
  @Post()
  addInterest(
    @GetUser('id') userId: string,
    @Body() createInterestDto: CreateInterestDto,
  ) {
    return this.interestService.addInterest(userId, createInterestDto);
  }

  /**************************************
   * READ OPERATIONS
   **************************************/

  @GetUserInterestsSwagger()
  @Get('my-interests')
  getUserInterests(
    @GetUser('id') userId: string,
    @Query() query: InterestQueryDto,
  ) {
    return this.interestService.getUserInterests(userId, query);
  }

  @GetEventInterestedUsersSwagger()
  @Get('event/:eventId/users')
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

  @CheckUserInterestSwagger()
  @Get('check/:eventId')
  checkUserInterest(
    @GetUser('id') userId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.interestService.checkUserInterest(userId, eventId);
  }

  /**************************************
   * DELETE OPERATIONS
   **************************************/

  @RemoveInterestSwagger()
  @Delete('event/:eventId')
  removeInterest(
    @GetUser('id') userId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.interestService.removeInterest(userId, eventId);
  }
}