import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export async function seedRefreshTokens(prisma: PrismaClient, users: any) {
  console.log('Seeding refresh tokens...');

  // Active tokens for regular users
  await createRefreshToken(prisma, {
    userId: users.regularUser1.id, // Sun Leang
    token: `valid-token-${uuidv4()}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  await createRefreshToken(prisma, {
    userId: users.regularUser2.id, // Daro
    token: `valid-token-${uuidv4()}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });

  // Active token for organizer1
  await createRefreshToken(prisma, {
    userId: users.organizer1.id, // ✅ Fixed: Changed from 'organizer' to 'organizer1'
    token: `valid-token-${uuidv4()}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });

  // Active token for organizer2
  await createRefreshToken(prisma, {
    userId: users.organizer2.id, // ✅ Added organizer2 token
    token: `valid-token-${uuidv4()}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });

  // Revoked token for regular user
  await createRefreshToken(prisma, {
    userId: users.regularUser3.id, // Seang
    token: `revoked-token-${uuidv4()}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isRevoked: true,
    revokedAt: new Date(),
  });

  // Expired token for admin
  await createRefreshToken(prisma, {
    userId: users.admin.id, // ✅ This should work as 'admin' key exists
    token: `expired-token-${uuidv4()}`,
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  });

  // Additional token for super admin
  await createRefreshToken(prisma, {
    userId: users.superAdmin.id, // ✅ Super admin token
    token: `superadmin-token-${uuidv4()}`,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
  });

  console.log('Refresh tokens seeded successfully');
  console.log('📊 Refresh tokens created for:');
  console.log('  - Regular users: 3 tokens');
  console.log('  - Organizers: 2 tokens');
  console.log('  - Admin: 1 expired token');
  console.log('  - Super Admin: 1 long-term token');
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
