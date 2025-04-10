import { Module } from '@nestjs/common';
import { EventCategoryService } from './category.service';
import { EventCategoryController } from './category.controller';
import { PrismaModule } from 'src/app/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EventCategoryController],
  providers: [EventCategoryService],
  exports: [EventCategoryService],
})
export class CategoryModule {}