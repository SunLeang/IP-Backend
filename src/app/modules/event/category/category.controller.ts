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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
  import { JwtAuthGuard } from 'src/app/modules/auth/guards/jwt-auth.guard';
  import { RolesGuard } from 'src/app/core/guards/roles.guard';
  import { Roles } from 'src/app/core/decorators/roles.decorator';
  import { Public } from 'src/app/core/decorators/public.decorator';
import { SystemRole } from '@prisma/client';

// Import Swagger decorators
import {
  CategoryControllerSwagger,
  CreateCategorySwagger,
  GetAllCategoriesSwagger,
  GetCategoryByIdSwagger,
  UpdateCategorySwagger,
  DeleteCategorySwagger,
} from './decorators/swagger';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/
@CategoryControllerSwagger()
@Controller('event-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**************************************
   * CREATE OPERATIONS
   **************************************/

  @CreateCategorySwagger()
  @Post()
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  /**************************************
   * READ OPERATIONS
   **************************************/

  @GetAllCategoriesSwagger()
  @Get()
  @Public()
  findAll() {
    return this.categoryService.findAll();
  }

  @GetCategoryByIdSwagger()
  @Get(':id')
  @Public()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.findOne(id);
  }

  /**************************************
   * UPDATE OPERATIONS
   **************************************/

  @UpdateCategorySwagger()
  @Patch(':id')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  /**************************************
   * DELETE OPERATIONS
   **************************************/

  @DeleteCategorySwagger()
  @Delete(':id')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.remove(id);
  }
}
