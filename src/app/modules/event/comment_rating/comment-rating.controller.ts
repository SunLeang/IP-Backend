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
import { CommentRatingService } from './services/comment-rating.service';
import { CreateCommentRatingDto } from './dto/create-comment-rating.dto';
import { UpdateCommentRatingDto } from './dto/update-comment-rating.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { GetUser } from '../../../core/decorators/get-user.decorator';
import { Roles } from '../../../core/decorators/roles.decorator';
import { Public } from '../../../core/decorators/public.decorator';
import { SystemRole } from '@prisma/client';

// Import Swagger decorators
import {
  CommentRatingControllerSwagger,
  CreateCommentRatingSwagger,
  GetEventCommentsRatingsSwagger,
  GetEventRatingStatsSwagger,
  GetUserCommentsRatingsSwagger,
  GetSpecificUserCommentsRatingsSwagger,
  GetOneCommentRatingSwagger,
  UpdateCommentRatingSwagger,
  DeleteCommentRatingSwagger,
} from './decorators/swagger';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/
@CommentRatingControllerSwagger()
@Controller('comments-ratings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentRatingController {
  constructor(private readonly commentRatingService: CommentRatingService) {}

  /**************************************
   * CREATE OPERATIONS
   **************************************/

  @CreateCommentRatingSwagger()
  @Post()
  create(
    @Body() createCommentRatingDto: CreateCommentRatingDto,
    @GetUser('id') userId: string,
  ) {
    return this.commentRatingService.create(createCommentRatingDto, userId);
  }

  /**************************************
   * READ OPERATIONS
   **************************************/

  @GetEventCommentsRatingsSwagger()
  @Get('event/:eventId')
  @Public()
  findAllForEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.commentRatingService.findAllForEvent(eventId);
  }

  @GetEventRatingStatsSwagger()
  @Get('event/:eventId/stats')
  @Public()
  getEventRatingStats(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.commentRatingService.getEventRatingStats(eventId);
  }

  @GetUserCommentsRatingsSwagger()
  @Get('my-comments')
  findAllByCurrentUser(@GetUser('id') userId: string) {
    return this.commentRatingService.findAllByUser(userId);
  }

  @GetSpecificUserCommentsRatingsSwagger()
  @Get('user/:userId')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  findAllByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.commentRatingService.findAllByUser(userId);
  }

  @GetOneCommentRatingSwagger()
  @Get(':id')
  @Public()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentRatingService.findOne(id);
  }

  /**************************************
   * UPDATE OPERATIONS
   **************************************/

  @UpdateCommentRatingSwagger()
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCommentRatingDto: UpdateCommentRatingDto,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.commentRatingService.update(
      id,
      updateCommentRatingDto,
      userId,
      userRole,
    );
  }

  /**************************************
   * DELETE OPERATIONS
   **************************************/

  @DeleteCommentRatingSwagger()
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.commentRatingService.remove(id, userId, userRole);
  }
}