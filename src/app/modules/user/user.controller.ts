import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/core/guards/roles.guard';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { GetUser } from 'src/app/core/decorators/get-user.decorator';
import { CurrentRole, SystemRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

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
}
