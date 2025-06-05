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

// Import Swagger decorators
import {
  AnnouncementControllerSwagger,
  CreateAnnouncementSwagger,
  GetEventAnnouncementsSwagger,
  GetAnnouncementByIdSwagger,
  UpdateAnnouncementSwagger,
  DeleteAnnouncementSwagger,
} from './decorators/swagger';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/
@AnnouncementControllerSwagger()
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  /**************************************
   * CREATE OPERATIONS
   **************************************/

  @CreateAnnouncementSwagger()
  @Post()
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
   * READ OPERATIONS
   **************************************/

  @GetEventAnnouncementsSwagger()
  @Get('event/:eventId')
  findAllByEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.announcementService.findAllByEvent(eventId);
  }

  @GetAnnouncementByIdSwagger()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.announcementService.findOne(id);
  }

  /**************************************
   * UPDATE OPERATIONS
   **************************************/

  @UpdateAnnouncementSwagger()
  @Patch(':id')
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
   * DELETE OPERATIONS
   **************************************/

  @DeleteAnnouncementSwagger()
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @GetUser('systemRole') userRole: SystemRole,
  ) {
    return this.announcementService.remove(id, userId, userRole);
  }
}