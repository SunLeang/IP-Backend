// src/app/modules/auth/services/auth.service.ts
import { 
  Injectable, 
  UnauthorizedException, 
  BadRequestException, 
  ConflictException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { SystemRole, User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password, ...userData } = registerDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Check username if provided
    if (username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        throw new ConflictException('Username already in use');
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create new user
    const newUser = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        ...userData,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        systemRole: true,
        currentRole: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(newUser.id, newUser.email);

    // Save refresh token
    await this.saveRefreshToken(newUser.id, tokens.refreshToken);

    return {
      user: newUser,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        systemRole: user.systemRole,
        currentRole: user.currentRole,
      },
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken: string) {
    // Revoke the refresh token
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

  async refreshTokens(userId: string, refreshToken: string) {
    // Find the refresh token in the database
    const tokenRecord = await this.prisma.refreshToken.findFirst({
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
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found or deleted');
    }

    // Revoke the old refresh token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Save new refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  private async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, token: string) {
    // Calculate expiry date
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
    const expiresIn = this.parseExpirationTime(refreshExpiration);
    const expiresAt = new Date(Date.now() + expiresIn);

    // Save to database
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return true;
  }

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

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}