import { SetMetadata } from '@nestjs/common';
import { CurrentRole } from '@prisma/client';

export const CURRENT_ROLE_KEY = 'currentRoles';
export const RequireCurrentRole = (...roles: CurrentRole[]) => SetMetadata(CURRENT_ROLE_KEY, roles);