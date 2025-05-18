import { PrismaClient, EventStatus } from '@prisma/client';

export async function seedEvents(
  prisma: PrismaClient,
  users: any,
  categories: any,
) {
  console.log('Seeding events...');

  const event1 = await createEvent(prisma, {
    name: 'Charity Run 2025',
    description: 'Annual charity run to raise funds for local hospitals',
    organizerId: users.organizer.id,
    categoryId: categories.charity.id,
    location: 'City Park',
    dateTime: new Date('2025-06-15T09:00:00Z'),
    status: EventStatus.PUBLISHED,
    acceptingVolunteers: true,
    profileImage: 'songkran.png',
    coverImage: 'songkran.png',
    locationImage: 'songkran.png',
  });

  const event2 = await createEvent(prisma, {
    name: 'Tech Workshop',
    description: 'Learn new programming skills',
    organizerId: users.organizer.id,
    categoryId: categories.education.id,
    location: 'Community Center',
    dateTime: new Date('2025-05-22T13:00:00Z'),
    status: EventStatus.PUBLISHED,
    acceptingVolunteers: true,
    profileImage: 'songkran.png',
    coverImage: 'songkran.png',
    locationImage: 'songkran.png',
  });

  const event3 = await createEvent(prisma, {
    name: 'Environmental Cleanup',
    description: 'Join us in cleaning the local beach',
    organizerId: users.organizer.id,
    categoryId: categories.environment.id,
    location: 'Sunset Beach',
    dateTime: new Date('2025-07-03T08:00:00Z'),
    status: EventStatus.PUBLISHED,
    acceptingVolunteers: true,
    profileImage: 'songkran.png',
    coverImage: 'songkran.png',
    locationImage: 'songkran.png',
  });

  const event4 = await createEvent(prisma, {
    name: 'Upcoming Hackathon',
    description: 'A 48-hour coding competition',
    organizerId: users.organizer.id,
    categoryId: categories.technology.id,
    location: 'Tech Hub',
    dateTime: new Date('2025-08-15T10:00:00Z'),
    status: EventStatus.DRAFT,
    acceptingVolunteers: true,
    profileImage: 'songkran.png',
    coverImage: 'songkran.png',
    locationImage: 'songkran.png',
  });

  console.log('Events seeded successfully');

  return {
    charityRun: event1,
    techWorkshop: event2,
    environmentalCleanup: event3,
    hackathon: event4,
  };
}

async function createEvent(prisma: PrismaClient, data: any) {
  return prisma.event.create({
    data: {
      name: data.name,
      description: data.description,
      locationDesc: data.location,
      dateTime: data.dateTime,
      status: data.status,
      acceptingVolunteers: data.acceptingVolunteers,
      profileImage: data.profileImage,
      coverImage: data.coverImage,
      locationImage: data.locationImage,
      organizer: { connect: { id: data.organizerId } },
      category: { connect: { id: data.categoryId } },
    },
  });
}
