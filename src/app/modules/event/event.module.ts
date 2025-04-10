import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { PrismaModule } from 'src/app/prisma/prisma.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [PrismaModule, CategoryModule],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}