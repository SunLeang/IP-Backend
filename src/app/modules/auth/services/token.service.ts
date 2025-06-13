import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/app/prisma/services/prisma.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate access and refresh tokens for a user
   */
  async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email: email,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email: email,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn:
            this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Save refresh token to database
   */
  async saveRefreshToken(userId: string, token: string) {
    const refreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
    const expiresIn = this.parseExpirationTime(refreshExpiration);
    const expiresAt = new Date(Date.now() + expiresIn);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return true;
  }

  /**
   * Save refresh token within a transaction
   */
  private async saveRefreshTokenInTransaction(
    tx: any,
    userId: string,
    token: string,
  ) {
    const refreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
    const expiresIn = this.parseExpirationTime(refreshExpiration);
    const expiresAt = new Date(Date.now() + expiresIn);

    await tx.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return true;
  }

  /**
   * Refresh tokens using refresh token
   */
  async refreshTokens(refreshToken: string) {
    try {
      console.log('🔄 Starting token refresh process...');

      // Verify and decode the refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const userId = payload.sub;
      console.log(`🔄 Refresh token decoded for user: ${userId}`);

      // Use transaction to handle race conditions
      const result = await this.prisma.$transaction(async (tx) => {
        // Find the refresh token in the database
        const tokenRecord = await tx.refreshToken.findFirst({
          where: {
            userId,
            token: refreshToken,
            isRevoked: false,
            expiresAt: {
              gt: new Date(),
            },
          },
        });

        if (!tokenRecord) {
          console.log('❌ Refresh token not found or expired in database');
          throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // Get complete user data
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            systemRole: true,
            currentRole: true,
            gender: true,
            age: true,
            org: true,
            deletedAt: true,
          },
        });

        if (!user || user.deletedAt) {
          console.log('❌ User not found or deleted');
          throw new UnauthorizedException('User not found or deleted');
        }

        // Revoke the old refresh token
        await tx.refreshToken.update({
          where: { id: tokenRecord.id },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
          },
        });

        console.log('✅ Old refresh token revoked');

        // Generate new tokens
        const tokens = await this.generateTokens(user.id, user.email);

        // Save new refresh token in transaction
        await this.saveRefreshTokenInTransaction(
          tx,
          user.id,
          tokens.refreshToken,
        );

        console.log('✅ New tokens generated and saved');

        return {
          ...tokens,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            systemRole: user.systemRole,
            currentRole: user.currentRole,
            gender: user.gender,
            age: user.age,
            org: user.org,
          },
        };
      });

      console.log('✅ Token refresh completed successfully');
      return result;
    } catch (error) {
      console.error('❌ Refresh token error:', error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // If it's a JWT error, convert to UnauthorizedException
      if (
        error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      throw new UnauthorizedException('Token refresh failed');
    }
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeRefreshToken(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        token: refreshToken,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId: userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Generate tokens for user (used by other services)
   */
  async generateTokensForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * Parse expiration time string to milliseconds
   */
  private parseExpirationTime(expiration: string): number {
    const match = expiration.match(/(\d+)([smhd])/);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000; // Default: 7 days in milliseconds
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000; // seconds to milliseconds
      case 'm':
        return value * 60 * 1000; // minutes to milliseconds
      case 'h':
        return value * 60 * 60 * 1000; // hours to milliseconds
      case 'd':
        return value * 24 * 60 * 60 * 1000; // days to milliseconds
      default:
        return 7 * 24 * 60 * 60 * 1000; // Default: 7 days
    }
  }
}
