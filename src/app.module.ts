import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './app/modules/auth/auth.module';
import { UserModule } from './app/modules/user/user.module';
import { PrismaModule } from './app/prisma/prisma.module';
import { AuthMiddleware } from './app/core/middleware/auth.middleware';
import { JwtAuthGuard } from './app/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './app/core/guards/roles.guard';
import { EventModule } from './app/modules/event/event.module';
import { CategoryModule } from './app/modules/event/category/category.module';
import { VolunteerModule } from './app/modules/event/volunteer/volunteer.module';
import { CommentRatingModule } from './app/modules/event/comment_rating/comment-rating.module';
import { AttendanceModule } from './app/modules/event/attendance/attendance.module';
import { NotificationModule } from './app/modules/notification/notification.module';
import { TaskModule } from './app/modules/event/task/task.module';
import { LoggerMiddleware } from './app/core/middleware/logger.middleware';
import { FileUploadModule } from './app/modules/shared/file-upload/file-upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    EventModule,
    CategoryModule,
    VolunteerModule,
    CommentRatingModule,
    AttendanceModule,
    NotificationModule,
    TaskModule,
    FileUploadModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
