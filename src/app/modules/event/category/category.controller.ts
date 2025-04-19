import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
  } from '@nestjs/common';
  import { CategoryService } from './category.service';
  import { CreateCategoryDto } from './dto/create-category.dto';
  import { UpdateCategoryDto } from './dto/update-category.dto';
  import { JwtAuthGuard } from 'src/app/modules/auth/guards/jwt-auth.guard';
  import { RolesGuard } from 'src/app/core/guards/roles.guard';
  import { Roles } from 'src/app/core/decorators/roles.decorator';
  import { Public } from 'src/app/core/decorators/public.decorator';
  import { SystemRole } from '@prisma/client';
  
  @Controller('event-categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}
  
    @Post()
    @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
    create(@Body() createCategoryDto: CreateCategoryDto) {
      return this.categoryService.create(createCategoryDto);
    }
  
    @Get()
    @Public()
    findAll() {
      return this.categoryService.findAll();
    }
  
    @Get(':id')
    @Public()
    findOne(@Param('id') id: string) {
      return this.categoryService.findOne(id);
    }
  
    @Patch(':id')
    @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
    update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
      return this.categoryService.update(id, updateCategoryDto);
    }
  
    @Delete(':id')
    @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
    remove(@Param('id') id: string) {
      return this.categoryService.remove(id);
    }
  }