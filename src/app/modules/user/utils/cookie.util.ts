import { Response } from 'express';

export class CookieUtil {
  static setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    user: any,
    role: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions = {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('userRole', role, {
      ...cookieOptions,
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
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      },
    );
  }

  static setStrictCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    user: any,
    role: string,
  ) {
    const cookieOptions = {
      httpOnly: false,
      secure: false,
      sameSite: 'strict' as const,
      path: '/',
    };

    res.cookie(
      'user',
      JSON.stringify({
        ...user,
        currentRole: role,
      }),
      {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      },
    );

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  static setCrossSiteCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    user: any,
    role: string,
  ) {
    const cookieOptions = {
      httpOnly: false,
      secure: true,
      sameSite: 'none' as const,
      path: '/',
    };

    res.cookie('user', JSON.stringify({ ...user, currentRole: role }), {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
