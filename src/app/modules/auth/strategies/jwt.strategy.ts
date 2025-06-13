import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { CurrentRole } from '@prisma/client'; // Fixed import path

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in the configuration');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      passReqToCallback: false,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          systemRole: true,
          currentRole: true,
          deletedAt: true,
        },
      });

      if (!user || user.deletedAt) {
        throw new UnauthorizedException('Invalid token or user does not exist');
      }

      // Ensure user has a currentRole (set default if null)
      if (!user.currentRole) {
        const updatedUser = await this.prisma.user.update({
          where: { id: user.id },
          data: { currentRole: CurrentRole.ATTENDEE },
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            systemRole: true,
            currentRole: true,
            deletedAt: true,
          },
        });
        return updatedUser;
      }

      return user;
    } catch (error) {
      console.error('JWT validation error:', error);
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
