import { PrismaClient, SystemRole, CurrentRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient) {
  console.log('Seeding users...');

  const admin = await createAdmin(prisma);
  const superAdmin = await createSuperAdmin(prisma);
  const organizer = await createOrganizer(prisma);
  const regularUser1 = await createRegularUser(prisma, 'Regular User 1');
  const regularUser2 = await createRegularUser(prisma, 'Regular User 2');
  const regularUser3 = await createRegularUser(prisma, 'Regular User 3');

  console.log('Users seeded successfully');

  return {
    admin,
    superAdmin,
    organizer,
    regularUser1,
    regularUser2,
    regularUser3,
  };
}

async function createAdmin(prisma: PrismaClient) {
  return prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: await bcrypt.hash('Password123!', 10),
      fullName: 'Admin User',
      systemRole: SystemRole.ADMIN,
      currentRole: CurrentRole.ATTENDEE,
      username: 'adminuser',
      gender: 'MALE',
      age: 35,
      org: 'Admin Organization',
      profileImage: 'songkran.png',
    },
  });
}

async function createSuperAdmin(prisma: PrismaClient) {
  return prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      password: await bcrypt.hash('Password123!', 10),
      fullName: 'Super Admin',
      systemRole: SystemRole.SUPER_ADMIN,
      currentRole: CurrentRole.ATTENDEE,
      username: 'superadmin',
      gender: 'FEMALE',
      age: 40,
      org: 'Admin Organization',
      profileImage: 'superadmin.png',
    },
  });
}

async function createOrganizer(prisma: PrismaClient) {
  return prisma.user.upsert({
    where: { email: 'organizer@example.com' },
    update: {},
    create: {
      email: 'organizer@example.com',
      password: await bcrypt.hash('Password123!', 10),
      fullName: 'Event Organizer',
      systemRole: SystemRole.ADMIN,
      currentRole: CurrentRole.ATTENDEE,
      username: 'organizer',
      gender: 'FEMALE',
      age: 32,
      org: 'Event Planning Co.',
      profileImage: 'organizer.png',
    },
  });
}

async function createRegularUser(prisma: PrismaClient, name: string) {
  const email = name.toLowerCase().replace(/\s+/g, '.') + '@example.com';
  const username = name.toLowerCase().replace(/\s+/g, '_');
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: await bcrypt.hash('Password123!', 10),
      fullName: name,
      systemRole: SystemRole.USER,
      currentRole: CurrentRole.ATTENDEE,
      username,
      gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
      age: 20 + Math.floor(Math.random() * 30),
      org: 'Local Community',
      profileImage: `${username}.png`,
    },
  });
}
