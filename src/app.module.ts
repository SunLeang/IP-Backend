import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './app/modules/auth/auth.module';
import { UserModule } from './app/modules/user/user.module';
import { PrismaModule } from './app/prisma/prisma.module';
import { AuthMiddleware } from './app/core/middleware/auth.middleware';
import { JwtAuthGuard } from './app/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './app/core/guards/roles.guard';
import { EventController } from './app/modules/event/event.controller';
import { EventService } from './app/modules/event/event.service';
import { EventModule } from './app/modules/event/event.module';
import { CategoryModule } from './app/modules/event/category/category.module';
import { VolunteerModule } from './app/modules/event/volunteer/volunteer.module';
import { CommentRatingModule } from './app/modules/event/comment_rating/comment-rating.module';
import { AttendanceModule } from './app/modules/event/attendance/attendance.module';
import { NotificationModule } from './app/modules/notification/notification.module';
import { TaskModule } from './app/modules/event/task/task.module';

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
  ],
  providers: [
    // Register JwtAuthGuard as a global guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Register RolesGuard as a global guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    EventService,
  ],
  controllers: [EventController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
