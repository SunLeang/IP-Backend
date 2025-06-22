import { PrismaClient } from '@prisma/client';

export async function seedCertificates(
  prisma: PrismaClient,
  users: any,
  events: any,
) {
  console.log('Seeding certificates...');

  // ✅ Only use fields that exist in your Certificate model
  await createCertificate(prisma, {
    userId: users.regularUser1.id,
    eventId: events.kizunaRun.id, // ✅ Updated to use correct event
    filePath: 'certificates/kizuna_completion_user1.pdf',
    issuedAt: new Date('2025-06-16T10:00:00Z'),
  });

  await createCertificate(prisma, {
    userId: users.regularUser2.id,
    eventId: events.kizunaRun.id, // ✅ Updated to use correct event
    filePath: 'certificates/kizuna_volunteer_user2.pdf',
    issuedAt: new Date('2025-06-16T10:00:00Z'),
  });

  await createCertificate(prisma, {
    userId: users.regularUser3.id,
    eventId: events.tanabataFestival.id, // ✅ Updated to use correct event
    filePath: 'certificates/tanabata_volunteer_user3.pdf',
    issuedAt: new Date('2025-07-14T10:00:00Z'),
  });

  await createCertificate(prisma, {
    userId: users.regularUser4.id,
    eventId: events.danceShow.id, // ✅ Updated to use correct event
    filePath: 'certificates/dance_volunteer_user4.pdf',
    issuedAt: new Date('2025-07-04T10:00:00Z'),
  });

  console.log('Certificates seeded successfully');
}

async function createCertificate(prisma: PrismaClient, data: any) {
  return prisma.certificate.create({
    data: {
      user: { connect: { id: data.userId } },
      event: { connect: { id: data.eventId } },
      filePath: data.filePath,
      issuedAt: data.issuedAt || new Date(),
      // ❌ Removed templateImage if it doesn't exist in your schema
    },
  });
}
