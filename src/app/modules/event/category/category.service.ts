import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**************************************
   * CREATE OPERATIONS
   **************************************/

  async create(createCategoryDto: CreateCategoryDto) {
    // Check if category with same name already exists
    const existingCategory = await this.prisma.eventCategory.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with name '${createCategoryDto.name}' already exists`,
      );
    }

    return this.prisma.eventCategory.create({
      data: createCategoryDto,
    });
  }

  /**************************************
   * FIND OPERATIONS
   **************************************/

  async findAll() {
    return this.prisma.eventCategory.findMany({
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.eventCategory.findUnique({
      where: { id },
      include: {
        events: {
          where: {
            deletedAt: null,
          },
          take: 10,
          orderBy: {
            dateTime: 'desc',
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  /**************************************
   * UPDATE OPERATIONS
   **************************************/

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Check if category exists
    const category = await this.prisma.eventCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if new name would conflict (if name is being updated)
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.prisma.eventCategory.findUnique({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException(
          `Category with name '${updateCategoryDto.name}' already exists`,
        );
      }
    }

    return this.prisma.eventCategory.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  /**************************************
   * DELETE OPERATIONS
   **************************************/

  async remove(id: string) {
    // Check if category exists
    const category = await this.prisma.eventCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Prevent deletion if category has events
    if (category._count.events > 0) {
      throw new ConflictException(
        `Cannot delete category with ${category._count.events} associated events`,
      );
    }

    return this.prisma.eventCategory.delete({
      where: { id },
    });
  }
}
