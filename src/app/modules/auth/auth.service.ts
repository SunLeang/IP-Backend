// src/app/modules/auth/services/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { SystemRole, User, CurrentRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password, ...userData } = registerDto;

    console.log('=== Register Debug ===');
    console.log('Email:', email);

    // Normalize email during registration
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Normalized email:', normalizedEmail);

    // Check if email already exists (case-insensitive)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
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
    console.log('Hashing password...');
    const hashedPassword = await this.hashPassword(password);

    // Create new user with normalized email
    const newUser = await this.prisma.user.create({
      data: {
        email: normalizedEmail, // Store normalized email
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
    await this.saveRefreshToken(newUser.id, tokens.refreshToken);

    return {
      user: newUser,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      const user = await this.validateUser(email, password);

      // Clean up ALL existing tokens for this user (not just refresh tokens)
      await this.prisma.refreshToken.updateMany({
        where: {
          userId: user.id,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      // Set default role to ATTENDEE if no role is set
      let currentRole = user.currentRole;
      if (!currentRole) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { currentRole: CurrentRole.ATTENDEE },
        });
        currentRole = CurrentRole.ATTENDEE;
      }

      // Generate fresh tokens
      const tokens = await this.generateTokens(user.id, user.email);
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          systemRole: user.systemRole,
          currentRole: currentRole,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
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

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  private async generateTokens(userId: string, email: string) {
    // Get the current user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        currentRole: true,
        systemRole: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Simplify JWT payload - only include essential data
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email: email,
          // Remove role fields that might cause conflicts
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

  private async saveRefreshToken(userId: string, token: string) {
    // Calculate expiry date
    const refreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
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
    try {
      console.log('=== verifyPassword Debug ===');
      console.log('Plain password:', plainPassword);
      console.log('Plain password length:', plainPassword.length);
      console.log('Hashed password:', hashedPassword);
      console.log('Hashed password length:', hashedPassword.length);

      const result = await bcrypt.compare(plainPassword, hashedPassword);
      console.log('bcrypt.compare result:', result);

      return result;
    } catch (error) {
      console.error('Error in verifyPassword:', error);
      return false;
    }
  }

  async validateUser(email: string, password: string) {
    console.log('=== validateUser Debug ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);

    // Normalize the email
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Normalized email:', normalizedEmail);

    // Use Prisma's case-insensitive search directly
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
        deletedAt: null, // Only get non-deleted users
      },
    });

    console.log('User found:', !!user);
    console.log('User deleted:', user?.deletedAt ? 'Yes' : 'No');

    if (!user || user.deletedAt) {
      console.log('❌ User not found or deleted');
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('Stored email:', user.email);
    console.log('Input email:', email);
    console.log('Normalized email:', normalizedEmail);

    const isPasswordValid = await this.verifyPassword(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Password validation failed');
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('✅ User validation successful');
    return user;
  }
}
