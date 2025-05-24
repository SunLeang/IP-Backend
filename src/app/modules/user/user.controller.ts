import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  Post,
  Inject,
  forwardRef,
  HttpCode,
  HttpStatus,
  Request,
  Response as NestResponse,
  Res,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/core/guards/roles.guard';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { GetUser } from 'src/app/core/decorators/get-user.decorator';
import { CurrentRole, SystemRole } from '@prisma/client';
import { VolunteerService } from '../event/volunteer/volunteer.service';
import { Public } from 'src/app/core/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly volunteerService: VolunteerService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @Roles(SystemRole.SUPER_ADMIN)
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @GetUser() currentUser) {
    // Users can view their own profile, admins can view any profile
    if (id !== currentUser.id && currentUser.systemRole === SystemRole.USER) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.userService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: any,
    @GetUser() currentUser,
  ) {
    // Regular users can only update their own profile
    if (id !== currentUser.id && currentUser.systemRole === SystemRole.USER) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Regular users cannot change systemRole
    if (
      updateUserDto.systemRole &&
      currentUser.systemRole === SystemRole.USER
    ) {
      throw new ForbiddenException('You cannot change your role');
    }

    // Regular users cannot change currentRole of other users
    if (
      updateUserDto.currentRole &&
      id !== currentUser.id &&
      currentUser.systemRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only super admins can change the current role of other users',
      );
    }

    // Only SUPER_ADMIN can set someone to ADMIN or SUPER_ADMIN
    if (
      updateUserDto.systemRole &&
      (updateUserDto.systemRole === SystemRole.ADMIN ||
        updateUserDto.systemRole === SystemRole.SUPER_ADMIN) &&
      currentUser.systemRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only super admins can assign admin privileges',
      );
    }

    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  remove(@Param('id') id: string, @GetUser() currentUser) {
    // Admin cannot delete super admin
    if (currentUser.systemRole === SystemRole.ADMIN) {
      const user = this.userService.findOne(id);
      if (user && user['systemRole'] === SystemRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Admin cannot delete a Super Admin account',
        );
      }
    }
    return this.userService.remove(id);
  }

  @Patch(':id/role')
  @Roles(SystemRole.SUPER_ADMIN)
  changeRole(@Param('id') id: string, @Body('role') role: SystemRole) {
    return this.userService.changeRole(id, role);
  }

  @Patch(':id/currentRole')
  @Roles(SystemRole.SUPER_ADMIN)
  changeCurrentRole(@Param('id') id: string, @Body('role') role: CurrentRole) {
    return this.userService.changeCurrentRole(id, role);
  }

  @Patch('me/currentRole')
  @UseGuards(JwtAuthGuard)
  @Roles(SystemRole.USER) // Add this line to allow any user to access this endpoint
  async switchCurrentRole(
    @Body('role') role: CurrentRole,
    @GetUser('id') userId: string,
    @GetUser('systemRole') systemRole: SystemRole,
  ) {
    // Only allow switching if user is VOLUNTEER or ATTENDEE
    if (![CurrentRole.VOLUNTEER, CurrentRole.ATTENDEE].includes(role)) {
      throw new ForbiddenException('Invalid role');
    }

    // Check if user has an approved volunteer application when switching to VOLUNTEER role
    if (role === CurrentRole.VOLUNTEER) {
      // Check if user has an approved volunteer application
      const hasApprovedApplication =
        await this.volunteerService.hasApprovedApplication(userId);

      if (!hasApprovedApplication) {
        throw new ForbiddenException(
          'You must have an approved volunteer application to switch to volunteer role',
        );
      }
    }

    return this.userService.changeCurrentRole(userId, role);
  }

  @Post('switch-role')
  @UseGuards(JwtAuthGuard)
  async switchRole(
    @GetUser('id') userId: string,
    @Body('role') role: CurrentRole,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      console.log(`User ${userId} requesting role switch to ${role}`);

      // Validate role input
      if (![CurrentRole.VOLUNTEER, CurrentRole.ATTENDEE].includes(role)) {
        throw new BadRequestException('Invalid role');
      }

      // Only validate VOLUNTEER role - ATTENDEE should always be allowed
      if (role === CurrentRole.VOLUNTEER) {
        const hasApprovedApplication =
          await this.volunteerService.hasApprovedApplication(userId);

        if (!hasApprovedApplication) {
          throw new ForbiddenException(
            'You must have an approved volunteer application to switch to volunteer role',
          );
        }
      }

      // Switch role and get new tokens
      const { user, accessToken, refreshToken } =
        await this.userService.switchRole(userId, role);

      // Set secure cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('userRole', role, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie(
        'user',
        JSON.stringify({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          currentRole: role,
          systemRole: user.systemRole,
        }),
        {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 15 * 60 * 1000,
        },
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          currentRole: role,
          systemRole: user.systemRole,
        },
        accessToken,
      };
    } catch (error) {
      console.error('Error in switch-role:', error);
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to switch role');
    }
  }

  @Post('switch-role-redirect')
  @HttpCode(HttpStatus.FOUND)
  @Public()
  async switchRoleRedirect(
    @Request() req,
    @Res() res: Response,
    @Body() body: { role: CurrentRole; redirectUrl: string; token: string },
  ) {
    try {
      // Verify the token
      const decoded = this.jwtService.verify(body.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Switch role
      const { user, accessToken, refreshToken } =
        await this.userService.switchRole(decoded.sub, body.role);

      // IMPORTANT: Set the user cookie with the updated user data
      // Make sure domain and path are specified
      res.cookie(
        'user',
        JSON.stringify({
          ...user,
          currentRole: body.role, // Force the role to match what was requested
        }),
        {
          httpOnly: false,
          path: '/',
          maxAge: 15 * 60 * 1000, // 15 minutes
          sameSite: 'strict',
        },
      );

      // Set similar options for the token cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: false,
        path: '/',
        maxAge: 15 * 60 * 1000, // 15 minutes
        sameSite: 'strict',
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: false,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'strict',
      });

      // Redirect to the specified URL
      return res.redirect(body.redirectUrl);
    } catch (error) {
      console.error('Error in switch-role-redirect:', error);
      // If token is invalid, redirect to login
      return res.redirect('/login');
    }
  }

  @Post('switch-role-direct')
  @HttpCode(HttpStatus.FOUND) // 302 Found - this forces a redirect
  @Public()
  async switchRoleDirect(
    @Request() req,
    @Res() res: Response,
    @Body() body: { role: CurrentRole; token: string; redirectUrl?: string },
  ) {
    try {
      // Verify the token
      const decoded = this.jwtService.verify(body.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Switch role
      const { user, accessToken, refreshToken } =
        await this.userService.switchRole(decoded.sub, body.role);

      // Determine redirect URL (fallback to home page if not provided)
      const redirectUrl =
        body.redirectUrl ||
        (body.role === 'VOLUNTEER'
          ? 'http://localhost:3000/volunteer-role/dashboard?reset=true'
          : 'http://localhost:3000/?bypass=true');

      // Set cookies - no httpOnly to allow JavaScript access
      res.cookie('user', JSON.stringify({ ...user, currentRole: body.role }), {
        httpOnly: false,
        path: '/',
        maxAge: 15 * 60 * 1000,
        sameSite: 'none', 
        secure: true, // Required when sameSite is 'none'
      });

      res.cookie('accessToken', accessToken, {
        httpOnly: false,
        path: '/',
        maxAge: 15 * 60 * 1000,
        sameSite: 'none',
        secure: true, // Required when sameSite is 'none'
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: false,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'none', // Changed from 'lax' to support cross-site
        secure: true, // Required when sameSite is 'none'
      });

      // Redirect directly to the frontend
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error in switch-role-direct:', error);
      // Redirect to login page on error
      return res.redirect('http://localhost:3000/login');
    }
  }
}
