import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/app/prisma/services/prisma.service';
import { CurrentRole, SystemRole } from '@prisma/client';
import { PasswordService } from '../../auth/services/password.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService, // ✅ Inject PasswordService
  ) {}

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
        profileImage: true, // ✅ Include profile image
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
      select: {
        id: true,
        password: true, // Need password for validation
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // ✅ Handle password change separately
    if (updateData.currentPassword && updateData.newPassword) {
      return this.changePassword(
        id,
        updateData.currentPassword,
        updateData.newPassword,
      );
    }

    // ✅ For regular updates, exclude password fields
    const { currentPassword, newPassword, ...regularUpdateData } = updateData;

    return this.prisma.user.update({
      where: { id },
      data: regularUpdateData,
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
        profileImage: true, // ✅ Include profile image
        updatedAt: true,
      },
    });
  }

  // ✅ NEW: Dedicated password change method
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    // Get user with password for validation
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        password: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Validate current password
    const isCurrentPasswordValid = await this.passwordService.verifyPassword(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword =
      await this.passwordService.hashPassword(newPassword);

    // Update password
    return this.prisma.user.update({
      where: { id },
      data: {
        password: hashedNewPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
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
        profileImage: true, // ✅ Include profile image
        updatedAt: true,
      },
    });
  }

  /**
   * Get all normal users (attendees/volunteers)
   */
  async getAllAttendees() {
    return this.prisma.user.findMany({
      where: {
        systemRole: SystemRole.USER,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        gender: true,
        age: true,
        org: true,
        currentRole: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all organizers (admins)
   */
  async getAllOrganizers() {
    return this.prisma.user.findMany({
      where: {
        systemRole: SystemRole.ADMIN,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        gender: true,
        age: true,
        org: true,
        currentRole: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            organizedEvents: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
