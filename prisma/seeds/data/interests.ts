import { PrismaClient } from '@prisma/client';

export async function seedInterests(
  prisma: PrismaClient,
  users: any,
  events: any,
) {
  console.log('Seeding event interests...');

  // User 1 interests
  await createInterest(prisma, users.regularUser1.id, events.charityRun.id);
  await createInterest(prisma, users.regularUser1.id, events.techWorkshop.id);

  // User 2 interests
  await createInterest(prisma, users.regularUser2.id, events.charityRun.id);
  await createInterest(
    prisma,
    users.regularUser2.id,
    events.environmentalCleanup.id,
  );

  // User 3 interests
  await createInterest(prisma, users.regularUser3.id, events.techWorkshop.id);
  await createInterest(prisma, users.regularUser3.id, events.hackathon.id);

  // Even organizer shows interest in other events
  await createInterest(
    prisma,
    users.organizer.id,
    events.environmentalCleanup.id,
  );

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
