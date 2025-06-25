import { PrismaClient } from '@prisma/client';

export async function seedInterests(
  prisma: PrismaClient,
  users: any,
  events: any,
) {
  console.log('Seeding event interests...');

  // ✅ Use correct event keys
  await createInterest(prisma, users.regularUser1.id, events.kizunaRun.id);
  await createInterest(prisma, users.regularUser1.id, events.danceShow.id);

  await createInterest(prisma, users.regularUser2.id, events.kizunaRun.id);
  await createInterest(prisma, users.regularUser2.id, events.scienceDays.id);

  await createInterest(
    prisma,
    users.regularUser3.id,
    events.tanabataFestival.id,
  );
  await createInterest(prisma, users.regularUser3.id, events.scienceDays.id);

  await createInterest(prisma, users.regularUser4.id, events.tenaConcert.id);
  await createInterest(prisma, users.regularUser4.id, events.danceShow.id);

  await createInterest(
    prisma,
    users.regularUser5.id,
    events.tanabataFestival.id,
  );
  await createInterest(prisma, users.regularUser5.id, events.tenaConcert.id);

  await createInterest(prisma, users.regularUser6.id, events.peaceMarch.id);
  await createInterest(prisma, users.regularUser6.id, events.danceShow.id);

  // Organizers show interest in other events
  await createInterest(prisma, users.organizer1.id, events.danceShow.id);
  await createInterest(prisma, users.organizer2.id, events.kizunaRun.id);

  console.log('Event interests seeded successfully');
}

async function createInterest(
  prisma: PrismaClient,
  userId: string,
  eventId: string,
) {
  return prisma.eventInterest.create({
    data: {
      user: { connect: { id: userId } },
      event: { connect: { id: eventId } },
    },
  });
}
