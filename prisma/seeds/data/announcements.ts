import { PrismaClient } from '@prisma/client';

export async function seedAnnouncements(prisma: PrismaClient, events: any) {
  console.log('Seeding announcements...');

  const announcement1 = await createAnnouncement(prisma, {
    title: 'Important Update for Charity Run',
    description:
      'The starting point has been changed to the north entrance. Please arrive 30 minutes early for check-in.',
    image: 'songkran.png',
    eventId: events.charityRun.id,
  });

  const announcement2 = await createAnnouncement(prisma, {
    title: 'New Speaker Added',
    description:
      'We are excited to announce that Dr. Jane Smith, AI expert from Tech University, will be joining our workshop!',
    image: 'songkran.png',
    eventId: events.techWorkshop.id,
  });

  const announcement3 = await createAnnouncement(prisma, {
    title: 'Equipment Requirements',
    description:
      'Please bring gloves and comfortable shoes for the beach cleanup. We will provide all other equipment.',
    image: 'songkran.png',
    eventId: events.environmentalCleanup.id,
  });

  const announcement4 = await createAnnouncement(prisma, {
    title: 'Weather Advisory',
    description:
      'In case of rain, the event will still proceed. We have covered areas available.',
    image: 'songkran.png',
    eventId: events.charityRun.id,
  });

  console.log('Announcements seeded successfully');

  return {
    charityRunUpdate: announcement1,
    newSpeaker: announcement2,
    cleanupEquipment: announcement3,
    weatherAdvisory: announcement4,
  };
}

async function createAnnouncement(prisma: PrismaClient, data: any) {
  return prisma.announcement.create({
    data: {
      title: data.title,
      description: data.description,
      image: data.image,
      event: { connect: { id: data.eventId } },
    },
  });
}
