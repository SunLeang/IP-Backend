import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { CurrentRole, SystemRole } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

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
}
