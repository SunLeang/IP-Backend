import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PasswordService } from './services/password.service';
import { UserAuthService } from './services/user-auth.service';
import { TokenService } from './services/token.service';

@Module({
  imports: [
    // Use ConfigModule to access environment variables
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }), // Set default strategy to JWT
    // Configure JWT module with async options
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '15m',
        },
      }),
    }),
    // Forward reference to UserModule to resolve circular dependency
    forwardRef(() => UserModule),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
      AuthService,
      UserAuthService,
      TokenService,
      PasswordService,
      JwtStrategy, 
      RefreshTokenStrategy,
    ],
  exports: [
    AuthService, 
    UserAuthService,
    TokenService,
    PasswordService,
    JwtStrategy, 
    PassportModule, 
    JwtModule
  ],
})
export class AuthModule {}
