import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Response } from 'express';
import { CurrentRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRoleService } from './user-role.service';
import { CookieUtil } from '../utils/cookie.util';

@Injectable()
export class UserIntegrationService {
  constructor(
    @Inject(forwardRef(() => UserRoleService))
    private readonly userRoleService: UserRoleService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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
      const { user, accessToken, refreshToken } =
        await this.userRoleService.switchRole(decoded.sub, body.role);

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
      const { user, accessToken, refreshToken } =
        await this.userRoleService.switchRole(decoded.sub, body.role);

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
