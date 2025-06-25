/**************************************
 * IMPORTS
 **************************************/
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/core/guards/roles.guard';
import { Roles } from 'src/app/core/decorators/roles.decorator';
import { GetUser } from 'src/app/core/decorators/get-user.decorator';
import { CurrentRole, SystemRole } from '@prisma/client';
import { Public } from 'src/app/core/decorators/public.decorator';

// Import services
import { UserService } from './services/user.service';
import { UserPermissionService } from './services/user-permission.service';
import { UserRoleService } from './services/user-role.service';
import { UserIntegrationService } from './services/user-integration.service';

// Import Swagger decorators
import {
  UserControllerSwagger,
  FindAllUsersSwagger,
  GetAllAttendeesSwagger,
  GetAllOrganizersSwagger,
  FindOneUserSwagger,
  UpdateUserSwagger,
  RemoveUserSwagger,
  ChangeRoleSwagger,
  ChangeCurrentRoleSwagger,
  SwitchCurrentRoleSwagger,
  SwitchRoleSwagger,
  SwitchRoleRedirectSwagger,
  SwitchRoleDirectSwagger,
} from './decorators/swagger';

/**************************************
 * CONTROLLER DEFINITION
 **************************************/
@UserControllerSwagger()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userPermissionService: UserPermissionService,
    private readonly userRoleService: UserRoleService,
    private readonly userIntegrationService: UserIntegrationService,
  ) {}

  /**************************************
   * ADMIN ENDPOINTS
   **************************************/

  @FindAllUsersSwagger()
  @Get()
  @Roles(SystemRole.SUPER_ADMIN)
  findAll() {
    return this.userService.findAll();
  }

  @GetAllAttendeesSwagger()
  @Get('attendees')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  getAllAttendees() {
    return this.userService.getAllAttendees();
  }

  @GetAllOrganizersSwagger()
  @Get('organizers')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  getAllOrganizers() {
    return this.userService.getAllOrganizers();
  }

  @FindOneUserSwagger()
  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() currentUser) {
    return this.userPermissionService.findOneWithPermissions(id, currentUser);
  }

  @UpdateUserSwagger()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: any,
    @GetUser() currentUser,
  ) {
    return this.userPermissionService.updateWithPermissions(
      id,
      updateUserDto,
      currentUser,
    );
  }

  @RemoveUserSwagger()
  @Delete(':id')
  @Roles(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  remove(@Param('id') id: string, @GetUser() currentUser) {
    return this.userPermissionService.removeWithPermissions(id, currentUser);
  }

  /**************************************
   * ROLE MANAGEMENT ENDPOINTS (ADMIN)
   **************************************/

  @ChangeRoleSwagger()
  @Patch(':id/role')
  @Roles(SystemRole.SUPER_ADMIN)
  changeRole(@Param('id') id: string, @Body('role') role: SystemRole) {
    return this.userPermissionService.changeRole(id, role);
  }

  @ChangeCurrentRoleSwagger()
  @Patch(':id/currentRole')
  @Roles(SystemRole.SUPER_ADMIN)
  changeCurrentRole(@Param('id') id: string, @Body('role') role: CurrentRole) {
    return this.userPermissionService.changeCurrentRole(id, role);
  }

  /**************************************
   * USER SELF-SERVICE ENDPOINTS
   **************************************/

  @SwitchCurrentRoleSwagger()
  @Patch('me/currentRole')
  @Roles(SystemRole.USER)
  switchCurrentRole(
    @Body('role') role: CurrentRole,
    @GetUser('id') userId: string,
  ) {
    return this.userRoleService.switchCurrentRoleWithValidation(userId, role);
  }

  @SwitchRoleSwagger()
  @Post('switch-role')
  @UseGuards(JwtAuthGuard)
  switchRole(
    @GetUser('id') userId: string,
    @Body('role') role: CurrentRole,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userRoleService.switchRoleWithTokens(userId, role, res);
  }

  /**************************************
   * FRONTEND INTEGRATION ENDPOINTS
   **************************************/

  @SwitchRoleRedirectSwagger()
  @Post('switch-role-redirect')
  @HttpCode(HttpStatus.FOUND)
  @Public()
  switchRoleRedirect(
    @Res() res: Response,
    @Body() body: { role: CurrentRole; redirectUrl: string; token: string },
  ) {
    return this.userIntegrationService.switchRoleWithRedirect(body, res);
  }

  @SwitchRoleDirectSwagger()
  @Post('switch-role-direct')
  @HttpCode(HttpStatus.FOUND)
  @Public()
  switchRoleDirect(
    @Res() res: Response,
    @Body() body: { role: CurrentRole; token: string; redirectUrl?: string },
  ) {
    return this.userIntegrationService.switchRoleDirectRedirect(body, res);
  }
}
