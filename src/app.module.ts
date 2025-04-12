import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './app/core/config/config.module';
import { PrismaModule } from './app/prisma/prisma.module';
import { UserModule } from './app/modules/user/user.module';
import { AuthModule } from './app/modules/auth/auth.module';
import { EventModule } from './app/modules/event/event.module';
import { CategoryModule } from './app/modules/event/category/category.module';
import { FileUploadModule } from './app/modules/shared/file-upload/file-upload.module';
import { NotificationModule } from './app/modules/notification/notification.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './app/core/guards/roles.guard';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    UserModule,
    AuthModule,
    EventModule,
    CategoryModule,
    FileUploadModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}