import { Injectable } from '@nestjs/common';
import { UserService } from './user.service';
import { PermissionUtil } from '../utils/permission.util';

@Injectable()
export class UserPermissionService {
  constructor(private readonly userService: UserService) {}

  /**************************************
   * PERMISSION-AWARE OPERATIONS
   **************************************/

  async findOneWithPermissions(id: string, currentUser: any) {
    PermissionUtil.validateViewPermission(id, currentUser);
    return this.userService.findOne(id);
  }

  async updateWithPermissions(id: string, updateData: any, currentUser: any) {
    PermissionUtil.validateUpdatePermission(id, updateData, currentUser);
    return this.userService.update(id, updateData);
  }

  async removeWithPermissions(id: string, currentUser: any) {
    await PermissionUtil.validateDeletePermission(
      id,
      currentUser,
      this.userService,
    );
    return this.userService.remove(id);
  }

  /**************************************
   * ADMIN ROLE MANAGEMENT
   **************************************/

  async changeRole(id: string, systemRole: any) {
    return this.userService.changeSystemRole(id, systemRole);
  }

  async changeCurrentRole(id: string, currentRole: any) {
    return this.userService.changeCurrentRole(id, currentRole);
  }
}
