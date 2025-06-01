import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

// Import controller
import { UserController } from './user.controller';

// Import services
import { UserService } from './services/user.service';
import { UserPermissionService } from './services/user-permission.service';
import { UserRoleService } from './services/user-role.service';
import { UserIntegrationService } from './services/user-integration.service';

// Import other modules
import { PrismaModule } from '../../prisma/prisma.module';
import { VolunteerModule } from '../event/volunteer/volunteer.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => VolunteerModule),
    forwardRef(() => AuthModule),
    JwtModule,
    ConfigModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserPermissionService,
    UserRoleService,
    UserIntegrationService,
  ],
  exports: [
    UserService,
    UserPermissionService,
    UserRoleService,
    UserIntegrationService,
  ],
})
export class UserModule {}
