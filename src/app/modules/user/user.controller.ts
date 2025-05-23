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
  Response,
} from '@nestjs/common';
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
  @Public()
  async userSwitchRole(
    @Body('role') role: CurrentRole,
    @GetUser('id') userId: string,
  ) {
    // Only allow switching if role is VOLUNTEER or ATTENDEE
    if (![CurrentRole.VOLUNTEER, CurrentRole.ATTENDEE].includes(role)) {
      throw new ForbiddenException('Invalid role');
    }

    // Check if user has an approved volunteer application when switching to VOLUNTEER role
    if (role === CurrentRole.VOLUNTEER) {
      const hasApprovedApplication =
        await this.volunteerService.hasApprovedApplication(userId);

      if (!hasApprovedApplication) {
        throw new ForbiddenException(
          'You must have an approved volunteer application to switch to volunteer role',
        );
      }
    }

    // Update the user's role
    const user = await this.userService.changeCurrentRole(userId, role);

    // Generate new tokens to reflect the role change
    const tokens = await this.authService.generateTokensForUser(userId);

    return {
      user,
      ...tokens,
    };
  }

  @Post('switch-role-redirect')
  @HttpCode(HttpStatus.FOUND)
  @Public()
  async switchRoleRedirect(
    @Request() req,
    @Response() res,
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

      // Set cookies for the tokens
      res.cookie('accessToken', accessToken, { httpOnly: true });
      res.cookie('refreshToken', refreshToken, { httpOnly: true });

      // Redirect to the specified URL
      return res.redirect(body.redirectUrl);
    } catch (error) {
      // If token is invalid, redirect to login
      return res.redirect('/login');
    }
  }
}
