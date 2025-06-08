// src/app/modules/volunteer/volunteer.module.ts
import { Module } from '@nestjs/common';
import { VolunteerService } from './services/volunteer.service';
import { VolunteerController } from './volunteer.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { NotificationModule } from '../../notification/notification.module';

// Import specialized services
import { VolunteerQueryService } from './services/volunteer-query.service';
import { VolunteerApplicationService } from './services/volunteer-application.service';
import { VolunteerCoreService } from './services/volunteer-core.service';
import { VolunteerPermissionService } from './services/volunteer-permission.service';
import { VolunteerNotificationService } from './services/volunteer-notification.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [VolunteerController],
  providers: [
    VolunteerService,
    VolunteerQueryService,
    VolunteerApplicationService,
    VolunteerCoreService,
    VolunteerPermissionService,
    VolunteerNotificationService,
  ],
  exports: [
    VolunteerService,
    VolunteerQueryService,
    VolunteerApplicationService,
    VolunteerCoreService,
    VolunteerPermissionService,
    VolunteerNotificationService,
  ],
})
export class VolunteerModule {}
