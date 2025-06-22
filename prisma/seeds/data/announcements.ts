import { PrismaClient } from '@prisma/client';

export async function seedAnnouncements(prisma: PrismaClient, events: any) {
  console.log('Seeding announcements...');

  // 🎯 ORGANIZER 1 EVENT ANNOUNCEMENTS
  const announcement1 = await createAnnouncement(prisma, {
    title: 'Important Update for Kizuna 2025',
    description:
      'The cultural booth setup has been moved to the main hall. Please arrive 30 minutes early for volunteer briefing.',
    image: 'kizuna_announcement.jpg',
    eventId: events.kizunaRun.id, // ✅ Updated to use correct event key
  });

  const announcement2 = await createAnnouncement(prisma, {
    title: 'Traditional Costume Guidelines',
    description:
      'Participants are welcome to wear traditional Japanese or Cambodian attire. Costume rental available at the venue.',
    image: 'kizuna_announcement.jpg',
    eventId: events.kizunaRun.id,
  });

  const announcement3 = await createAnnouncement(prisma, {
    title: 'Star Festival Weather Update',
    description:
      'Clear skies expected for Tanabata Festival! Perfect for stargazing activities. Bring your wishes to hang on the bamboo tree.',
    image: 'tanabata_announcement.jpg',
    eventId: events.tanabataFestival.id, // ✅ Updated to use correct event key
  });

  // 🎯 ORGANIZER 2 EVENT ANNOUNCEMENTS
  const announcement4 = await createAnnouncement(prisma, {
    title: 'Dance Performance Schedule',
    description:
      'Updated performance schedule: Apsara dance at 8:30 AM, Robam Tep Monorom at 9:15 AM. Please arrive early for seating.',
    image: 'dance_announcement.jpg',
    eventId: events.danceShow.id, // ✅ Updated to use correct event key
  });

  const announcement5 = await createAnnouncement(prisma, {
    title: 'New Lab Station Added',
    description:
      'We are excited to announce a new robotics lab station featuring AI demonstrations! Limited to 20 participants per session.',
    image: 'science_announcement.jpg',
    eventId: events.scienceDays.id, // ✅ Updated to use correct event key
  });

  const announcement6 = await createAnnouncement(prisma, {
    title: 'Concert Venue Changed',
    description:
      'Due to overwhelming response, the Tena Concert venue has been moved to the larger Aeon SenSok auditorium. Same time, bigger space!',
    image: 'concert_announcement.jpg',
    eventId: events.tenaConcert.id, // ✅ Updated to use correct event key
  });

  const announcement7 = await createAnnouncement(prisma, {
    title: 'March Route Safety Guidelines',
    description:
      'Please wear comfortable walking shoes and bring water bottles. First aid stations will be available every 500 meters along the route.',
    image: 'march_announcement.jpg',
    eventId: events.peaceMarch.id, // ✅ Updated to use correct event key
  });

  console.log('Announcements seeded successfully');
  console.log('📊 Announcement distribution:');
  console.log('  - Organizer 1 events: 3 announcements');
  console.log('  - Organizer 2 events: 4 announcements');

  return {
    kizunaUpdate: announcement1,
    kizunaCostume: announcement2,
    tanabataWeather: announcement3,
    danceSchedule: announcement4,
    scienceLab: announcement5,
    concertVenue: announcement6,
    marchSafety: announcement7,
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
