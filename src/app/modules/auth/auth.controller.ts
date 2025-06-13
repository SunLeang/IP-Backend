// src/app/modules/auth/controllers/auth.controller.ts
/**************************************
 * IMPORTS
 **************************************/
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GetUser } from 'src/app/core/decorators/get-user.decorator';
import { Public } from 'src/app/core/decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from 'src/app/core/guards/refresh-token.guard';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { RolesGuard } from 'src/app/core/guards/roles.guard';
import { SystemRole } from '@prisma/client';

// Import our custom Swagger decorators
import {
  AuthControllerSwagger,
  RegisterSwagger,
  LoginSwagger,
  LogoutSwagger,
  RefreshTokenSwagger,
  GetProfileSwagger,
  AdminRouteSwagger,
  SuperAdminRouteSwagger,
} from './decorators/swagger';
import { RefreshTokenDto } from './dto/refresh-token.dto';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/
@AuthControllerSwagger()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**************************************
   * PUBLIC ENDPOINTS
   **************************************/

  @RegisterSwagger()
  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @LoginSwagger()
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @RefreshTokenSwagger()
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    console.log('🔄 Refresh endpoint called');

    if (!refreshTokenDto.refreshToken) {
      console.log('❌ No refresh token provided in request body');
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const result = await this.authService.refreshTokens(
        refreshTokenDto.refreshToken,
      );
      console.log('✅ Refresh endpoint successful');

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      console.error('❌ Refresh endpoint error:', error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Failed to refresh token');
    }
  }

  /**************************************
   * PROTECTED ENDPOINTS
   **************************************/

  @LogoutSwagger()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @GetUser('id') userId: string,
    @Body() body: { refreshToken: string },
  ) {
    return this.authService.logout(userId, body.refreshToken);
  }

  /**************************************
   * USER PROFILE ENDPOINTS
   **************************************/

  @GetProfileSwagger()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@GetUser() user) {
    console.log('📋 Profile endpoint called for user:', user.id);

    // Return the user data that was validated by JWT strategy
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      systemRole: user.systemRole,
      currentRole: user.currentRole,
    };
  }

  /**************************************
   * ADMIN ENDPOINTS
   **************************************/

  @AdminRouteSwagger()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN)
  @Get('admin')
  adminRoute() {
    return { message: 'This is an admin route' };
  }

  @SuperAdminRouteSwagger()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.SUPER_ADMIN)
  @Get('super-admin')
  superAdminRoute() {
    return { message: 'This is a super admin route' };
  }
}
