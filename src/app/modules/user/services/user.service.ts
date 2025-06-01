import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { CurrentRole, SystemRole } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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
   * BASIC ROLE OPERATIONS
   **************************************/

  async changeSystemRole(id: string, systemRole: SystemRole) {
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
}
