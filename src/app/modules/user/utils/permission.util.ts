import { ForbiddenException } from '@nestjs/common';
import { SystemRole } from '@prisma/client';

export class PermissionUtil {
  static validateViewPermission(targetUserId: string, currentUser: any) {
    if (
      targetUserId !== currentUser.id &&
      currentUser.systemRole === SystemRole.USER
    ) {
      throw new ForbiddenException('You can only view your own profile');
    }
  }

  static validateUpdatePermission(
    targetUserId: string,
    updateData: any,
    currentUser: any,
  ) {
    // Regular users can only update their own profile
    if (
      targetUserId !== currentUser.id &&
      currentUser.systemRole === SystemRole.USER
    ) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Regular users cannot change systemRole
    if (updateData.systemRole && currentUser.systemRole === SystemRole.USER) {
      throw new ForbiddenException('You cannot change your role');
    }

    // Regular users cannot change currentRole of other users
    if (
      updateData.currentRole &&
      targetUserId !== currentUser.id &&
      currentUser.systemRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only super admins can change the current role of other users',
      );
    }

    // Only SUPER_ADMIN can set someone to ADMIN or SUPER_ADMIN
    if (
      updateData.systemRole &&
      (updateData.systemRole === SystemRole.ADMIN ||
        updateData.systemRole === SystemRole.SUPER_ADMIN) &&
      currentUser.systemRole !== SystemRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only super admins can assign admin privileges',
      );
    }
  }

  static async validateDeletePermission(
    targetUserId: string,
    currentUser: any,
    userService: any,
  ) {
    // Admin cannot delete super admin
    if (currentUser.systemRole === SystemRole.ADMIN) {
      const user = await userService.findOne(targetUserId);
      if (user && user.systemRole === SystemRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Admin cannot delete a Super Admin account',
        );
      }
    }
  }
}
