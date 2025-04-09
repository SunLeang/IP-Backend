import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './app/core/config/config.module';
import { PrismaModule } from './app/prisma/prisma.module';
import { UserModule } from './app/modules/user/user.module';
import { AuthModule } from './app/modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}