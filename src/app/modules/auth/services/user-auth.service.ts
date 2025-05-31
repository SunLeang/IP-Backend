import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { CurrentRole } from '@prisma/client';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Injectable()
export class UserAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
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
    const hashedPassword = await this.passwordService.hashPassword(password);

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
    const tokens = await this.tokenService.generateTokens(
      newUser.id,
      newUser.email,
    );
    await this.tokenService.saveRefreshToken(newUser.id, tokens.refreshToken);

    return {
      user: newUser,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      const user = await this.validateUser(email, password);

      // Clean up ALL existing tokens for this user
      await this.tokenService.revokeAllUserTokens(user.id);

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
      const tokens = await this.tokenService.generateTokens(
        user.id,
        user.email,
      );
      await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

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

    const isPasswordValid = await this.passwordService.verifyPassword(
      password,
      user.password,
    );
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Password validation failed');
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('✅ User validation successful');
    return user;
  }
}
