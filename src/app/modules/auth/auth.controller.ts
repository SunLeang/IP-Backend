// src/app/modules/auth/controllers/auth.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GetUser } from 'src/app/core/decorators/get-user.decorator';
import { Public } from 'src/app/core/decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from 'src/app/core/guards/refresh-token.guard';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { RolesGuard } from 'src/app/core/guards/roles.guard';
import { SystemRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @GetUser('id') userId: string,
    @Body() body: { refreshToken: string },
  ) {
    return this.authService.logout(userId, body.refreshToken);
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetUser('id') userId: string,
    @GetUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.USER)
  @Get('profile')
  getProfile(@GetUser() user) {
    return user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN)
  @Get('admin')
  adminRoute() {
    return { message: 'This is an admin route' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.SUPER_ADMIN)
  @Get('super-admin')
  superAdminRoute() {
    return { message: 'This is a super admin route' };
  }
}