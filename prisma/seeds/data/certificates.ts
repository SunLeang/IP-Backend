import { PrismaClient } from '@prisma/client';

export async function seedCertificates(
  prisma: PrismaClient,
  users: any,
  events: any,
) {
  console.log('Seeding certificates...');

  await createCertificate(prisma, {
    userId: users.regularUser1.id,
    eventId: events.charityRun.id,
    filePath: 'certificates/charity_run_completion_user1.pdf',
    issuedAt: new Date(new Date().setDate(new Date().getDate() - 10)),
  });

  await createCertificate(prisma, {
    userId: users.regularUser2.id,
    eventId: events.charityRun.id,
    filePath: 'certificates/charity_run_completion_user2.pdf',
    issuedAt: new Date(new Date().setDate(new Date().getDate() - 10)),
  });

  await createCertificate(prisma, {
    userId: users.regularUser2.id,
    eventId: events.techWorkshop.id,
    filePath: 'certificates/tech_workshop_volunteer_user2.pdf',
    issuedAt: new Date(new Date().setDate(new Date().getDate() - 5)),
  });

  await createCertificate(prisma, {
    userId: users.regularUser1.id,
    eventId: events.techWorkshop.id,
    filePath: 'certificates/tech_workshop_completion_user1.pdf',
    issuedAt: new Date(new Date().setDate(new Date().getDate() - 5)),
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
      templateImage: 'songkran.png', // Add if your model has this
    },
  });
}
