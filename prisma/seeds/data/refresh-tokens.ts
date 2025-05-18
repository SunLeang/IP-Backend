import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export async function seedRefreshTokens(prisma: PrismaClient, users: any) {
  console.log('Seeding refresh tokens...');

  // Active tokens
  await createRefreshToken(prisma, {
    userId: users.regularUser1.id,
    token: `valid-token-${uuidv4()}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  await createRefreshToken(prisma, {
    userId: users.regularUser2.id,
    token: `valid-token-${uuidv4()}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  await createRefreshToken(prisma, {
    userId: users.organizer.id,
    token: `valid-token-${uuidv4()}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });

  // Revoked token
  await createRefreshToken(prisma, {
    userId: users.regularUser3.id,
    token: `revoked-token-${uuidv4()}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isRevoked: true,
    revokedAt: new Date(),
  });

  // Expired token
  await createRefreshToken(prisma, {
    userId: users.admin.id,
    token: `expired-token-${uuidv4()}`,
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  });

  console.log('Refresh tokens seeded successfully');
}

async function createRefreshToken(prisma: PrismaClient, data: any) {
  return prisma.refreshToken.create({
    data: {
      token: data.token,
      expiresAt: data.expiresAt,
      user: { connect: { id: data.userId } },
      isRevoked: data.isRevoked || false,
      revokedAt: data.revokedAt,
    },
  });
}
