
import { Prisma } from '@prisma/client';

export class RefreshToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    revokedAt?: Date;
    isRevoked: boolean;
  }


  