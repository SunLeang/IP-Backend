import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { EventCategory, Prisma } from '@prisma/client';
import { CreateEventCategoryDto, UpdateEventCategoryDto } from './dto/event-category.dto';

@Injectable()
export class EventCategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<EventCategory[]> {
    return this.prisma.eventCategory.findMany();
  }

  async findOne(id: string): Promise<EventCategory> {
    const category = await this.prisma.eventCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Event category with ID ${id} not found`);
    }

    return category;
  }

  async create(data: CreateEventCategoryDto): Promise<EventCategory> {
    try {
      return await this.prisma.eventCategory.create({
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (error.code === 'P2002') {
          throw new ConflictException('Category with this name already exists');
        }
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateEventCategoryDto): Promise<EventCategory> {
    await this.findOne(id); // Check if category exists
    
    try {
      return await this.prisma.eventCategory.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Category with this name already exists');
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<EventCategory> {
    await this.findOne(id); // Check if category exists
    
    // Check if category is being used by any events
    const eventsWithCategory = await this.prisma.event.count({
      where: { categoryId: id },
    });

    if (eventsWithCategory > 0) {
      throw new ConflictException('Cannot delete category that is being used by events');
    }

    return this.prisma.eventCategory.delete({
      where: { id },
    });
  }
}