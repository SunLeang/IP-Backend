// src/app/modules/volunteer/volunteer.module.ts
import { Module } from '@nestjs/common';
import { VolunteerService } from './volunteer.service';
import { VolunteerController } from './volunteer.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { NotificationModule } from '../../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [VolunteerController],
  providers: [VolunteerService],
  exports: [VolunteerService],
})
export class VolunteerModule {}
