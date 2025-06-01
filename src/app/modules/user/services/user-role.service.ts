import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Response } from 'express';
import { CurrentRole } from '@prisma/client';
import { UserService } from './user.service';
import { AuthService } from '../../auth/services/auth.service';
import { VolunteerService } from '../../event/volunteer/volunteer.service';
import { CookieUtil } from '../utils/cookie.util';

@Injectable()
export class UserRoleService {
  constructor(
    private readonly userService: UserService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => VolunteerService))
    private readonly volunteerService: VolunteerService,
  ) {}

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

    return this.userService.changeCurrentRole(userId, role);
  }

  async switchRole(id: string, currentRole: CurrentRole) {
    // First update the user's role
    const user = await this.userService.changeCurrentRole(id, currentRole);

    // Get complete user data including systemRole
    const fullUser = await this.userService.findOne(id);

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
}
