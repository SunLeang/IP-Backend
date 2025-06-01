import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { CurrentRole, SystemRole } from '@prisma/client';
import { AuthService } from '../auth/services/auth.service';
import { VolunteerService } from '../event/volunteer/volunteer.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CookieUtil } from './utils/cookie.util';
import { PermissionUtil } from './utils/permission.util';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => VolunteerService))
    private readonly volunteerService: VolunteerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**************************************
   * BASIC CRUD OPERATIONS
   **************************************/

  async findAll() {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        systemRole: true,
        currentRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        gender: true,
        age: true,
        org: true,
        systemRole: true,
        currentRole: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateData: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        gender: true,
        age: true,
        org: true,
        systemRole: true,
        currentRole: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Soft delete
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      select: {
        id: true,
      },
    });
  }

  /**************************************
   * PERMISSION-AWARE OPERATIONS
   **************************************/

  async findOneWithPermissions(id: string, currentUser: any) {
    PermissionUtil.validateViewPermission(id, currentUser);
    return this.findOne(id);
  }

  async updateWithPermissions(id: string, updateData: any, currentUser: any) {
    PermissionUtil.validateUpdatePermission(id, updateData, currentUser);
    return this.update(id, updateData);
  }

  async removeWithPermissions(id: string, currentUser: any) {
    await PermissionUtil.validateDeletePermission(id, currentUser, this);
    return this.remove(id);
  }

  /**************************************
   * ROLE MANAGEMENT OPERATIONS
   **************************************/

  async changeRole(id: string, systemRole: SystemRole) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { systemRole },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        systemRole: true,
        updatedAt: true,
      },
    });
  }

  async changeCurrentRole(id: string, currentRole: CurrentRole) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { currentRole },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        currentRole: true,
        systemRole: true,
        updatedAt: true,
      },
    });
  }

  /**************************************
   * ROLE SWITCHING WITH VALIDATION
   **************************************/

  async switchCurrentRoleWithValidation(userId: string, role: CurrentRole) {
    // Validate role input
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

    return this.changeCurrentRole(userId, role);
  }

  async switchRole(id: string, currentRole: CurrentRole) {
    // First update the user's role
    const user = await this.changeCurrentRole(id, currentRole);

    // Get complete user data including systemRole
    const fullUser = await this.findOne(id);

    if (!fullUser) {
      throw new Error('User not found');
    }

    // Generate new tokens with updated role
    const tokens = await this.authService.generateTokensForUser(id);

    return {
      user: fullUser, // Return the complete user object with systemRole
      ...tokens,
    };
  }

  /**************************************
   * ROLE SWITCHING WITH TOKENS AND COOKIES
   **************************************/

  async switchRoleWithTokens(userId: string, role: CurrentRole, res: Response) {
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
      const { user, accessToken, refreshToken } = await this.switchRole(
        userId,
        role,
      );

      // Set secure cookies
      CookieUtil.setAuthCookies(res, accessToken, refreshToken, user, role);

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

  /**************************************
   * FRONTEND INTEGRATION METHODS
   **************************************/

  async switchRoleWithRedirect(
    body: { role: CurrentRole; redirectUrl: string; token: string },
    res: Response,
  ) {
    try {
      // Verify the token
      const decoded = this.jwtService.verify(body.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Switch role
      const { user, accessToken, refreshToken } = await this.switchRole(
        decoded.sub,
        body.role,
      );

      // Set cookies and redirect
      CookieUtil.setStrictCookies(
        res,
        accessToken,
        refreshToken,
        user,
        body.role,
      );

      return res.redirect(body.redirectUrl);
    } catch (error) {
      console.error('Error in switch-role-redirect:', error);
      return res.redirect('/login');
    }
  }

  async switchRoleDirectRedirect(
    body: { role: CurrentRole; token: string; redirectUrl?: string },
    res: Response,
  ) {
    try {
      // Verify the token
      const decoded = this.jwtService.verify(body.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Switch role
      const { user, accessToken, refreshToken } = await this.switchRole(
        decoded.sub,
        body.role,
      );

      // Determine redirect URL
      const redirectUrl =
        body.redirectUrl ||
        (body.role === 'VOLUNTEER'
          ? 'http://localhost:3000/volunteer-role/dashboard?reset=true'
          : 'http://localhost:3000/?bypass=true');

      // Set cookies
      CookieUtil.setCrossSiteCookies(
        res,
        accessToken,
        refreshToken,
        user,
        body.role,
      );

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error in switch-role-direct:', error);
      return res.redirect('http://localhost:3000/login');
    }
  }
}
