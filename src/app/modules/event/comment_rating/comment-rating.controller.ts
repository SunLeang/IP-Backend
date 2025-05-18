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
import { CommentRatingService } from './comment-rating.service';
import { CreateCommentRatingDto } from './dto/create-comment-rating.dto';
import { UpdateCommentRatingDto } from './dto/update-comment-rating.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/core/guards/roles.guard';
import { GetUser } from 'src/app/core/decorators/get-user.decorator';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { Public } from 'src/app/core/decorators/public.decorator';
import { SystemRole } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('comments-ratings')
@ApiBearerAuth()
@Controller('comments-ratings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentRatingController {
  constructor(private readonly commentRatingService: CommentRatingService) {}

  /**************************************
   * CREATE COMMENT RATING ENDPOINT
   **************************************/
  @Post()
  @ApiOperation({ summary: 'Create a new comment and rating' })
  @ApiResponse({
    status: 201,
    description: 'The comment and rating has been created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({
    status: 403,
    description: 'User is not authorized or event has not ended',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({
    status: 409,
    description: 'User has already commented on this event',
  })
  @ApiBody({
    type: CreateCommentRatingDto,
    description: 'Comment and rating data',
  })
  create(
    @Body() createCommentRatingDto: CreateCommentRatingDto,
    @GetUser('id') userId: string,
  ) {
    return this.commentRatingService.create(createCommentRatingDto, userId);
  }

  /**************************************
   * GET EVENT COMMENTS RATINGS ENDPOINT
   **************************************/
  @Get('event/:eventId')
  @Public()
  @ApiOperation({ summary: 'Get all comments and ratings for an event' })
  @ApiResponse({
    status: 200,
    description: 'Returns all comments and ratings for the event',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  findAllForEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.commentRatingService.findAllForEvent(eventId);
  }

  /**************************************
   * GET EVENT RATING STATS ENDPOINT
   **************************************/
  @Get('event/:eventId/stats')
  @Public()
  @ApiOperation({ summary: 'Get rating statistics for an event' })
  @ApiResponse({
    status: 200,
    description: 'Returns rating statistics for the event',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  getEventRatingStats(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.commentRatingService.getEventRatingStats(eventId);
  }

  /**************************************
   * GET USER'S COMMENTS RATINGS ENDPOINT
   **************************************/
  @Get('my-comments')
  @ApiOperation({ summary: 'Get all comments and ratings by the current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all comments and ratings by the user',
  })
  findAllByCurrentUser(@GetUser('id') userId: string) {
    return this.commentRatingService.findAllByUser(userId);
  }

  /**************************************
   * GET SPECIFIC USER'S COMMENTS RATINGS ENDPOINT
   **************************************/
  @Get('user/:userId')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get all comments and ratings by a specific user (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all comments and ratings by the user',
  })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  findAllByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.commentRatingService.findAllByUser(userId);
  }

  /**************************************
   * GET ONE COMMENT RATING ENDPOINT
   **************************************/
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a specific comment and rating by ID' })
  @ApiResponse({ status: 200, description: 'Returns the comment and rating' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentRatingService.findOne(id);
  }

  /**************************************
   * UPDATE COMMENT RATING ENDPOINT
   **************************************/
  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment and rating' })
  @ApiResponse({
    status: 200,
    description: 'The comment and rating has been updated',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to update this comment',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiBody({
    type: UpdateCommentRatingDto,
    description: 'Updated comment and rating data',
  })
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
   * DELETE COMMENT RATING ENDPOINT
   **************************************/
  @Delete(':id')
  @ApiOperation({ summary: 'Delete (soft) a comment and rating' })
  @ApiResponse({
    status: 200,
    description: 'The comment and rating has been deleted',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to delete this comment',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.commentRatingService.remove(id, userId, userRole);
  }
}
