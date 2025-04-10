import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Patch, 
    Param, 
    Delete, 
    UseGuards,
    ParseUUIDPipe
  } from '@nestjs/common';
  import { EventCategoryService } from './category.service';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { CreateEventCategoryDto, UpdateEventCategoryDto } from './dto/event-category.dto';
  import { EventCategory } from '@prisma/client';
  import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
  
  @ApiTags('event-categories')
  @Controller('event-categories')
  export class EventCategoryController {
    constructor(private readonly eventCategoryService: EventCategoryService) {}
  
    @ApiOperation({ summary: 'Get all event categories' })
    @ApiResponse({ status: 200, description: 'Return all event categories' })
    @Get()
    async findAll(): Promise<EventCategory[]> {
      return this.eventCategoryService.findAll();
    }
  
    @ApiOperation({ summary: 'Get an event category by id' })
    @ApiResponse({ status: 200, description: 'Return an event category by id' })
    @ApiResponse({ status: 404, description: 'Event category not found' })
    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<EventCategory> {
      return this.eventCategoryService.findOne(id);
    }
  
    @ApiOperation({ summary: 'Create a new event category' })
    @ApiResponse({ status: 201, description: 'The event category has been successfully created' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 409, description: 'Category with this name already exists' })
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post()
    async create(@Body() createEventCategoryDto: CreateEventCategoryDto): Promise<EventCategory> {
      return this.eventCategoryService.create(createEventCategoryDto);
    }
  
    @ApiOperation({ summary: 'Update an event category' })
    @ApiResponse({ status: 200, description: 'The event category has been successfully updated' })
    @ApiResponse({ status: 404, description: 'Event category not found' })
    @ApiResponse({ status: 409, description: 'Category with this name already exists' })
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Patch(':id')
    async update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateEventCategoryDto: UpdateEventCategoryDto,
    ): Promise<EventCategory> {
      return this.eventCategoryService.update(id, updateEventCategoryDto);
    }
  
    @ApiOperation({ summary: 'Delete an event category' })
    @ApiResponse({ status: 200, description: 'The event category has been successfully deleted' })
    @ApiResponse({ status: 404, description: 'Event category not found' })
    @ApiResponse({ status: 409, description: 'Cannot delete category that is being used by events' })
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<EventCategory> {
      return this.eventCategoryService.remove(id);
    }
  }