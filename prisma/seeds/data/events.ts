import { PrismaClient, EventStatus } from '@prisma/client';
import { MinioSeedUploader } from '../utils/minio-upload.util';
import { join } from 'path';

// ✅ Define the upload result type
interface UploadResult {
  originalUrl: string;
  thumbnailUrl: string;
  filename: string;
}

export async function seedEvents(
  prisma: PrismaClient,
  users: any,
  categories: any,
) {
  console.log('Seeding events with MinIO images...');

  const uploader = new MinioSeedUploader();

  const eventsData = [
    {
      name: 'Charity Run 2025',
      description: 'Annual charity run to raise funds for local hospitals',
      categoryKey: 'charity',
      location: 'City Park',
      dateTime: new Date('2025-06-15T09:00:00Z'),
      key: 'charityRun',
      images: {
        profile: 'charity-run.jpg', // ✅ Use existing file name
        cover: 'charity-run.jpg', // ✅ Use existing file name
        location: 'charity-run.jpg', // ✅ Use existing file name
      },
    },
    {
      name: 'Tech Workshop',
      description: 'Learn new programming skills',
      categoryKey: 'education',
      location: 'Community Center',
      dateTime: new Date('2025-05-22T13:00:00Z'),
      key: 'techWorkshop',
      images: {
        profile: 'tech-workshop.jpg', // ✅ Use existing file name
        cover: 'tech-workshop.jpg', // ✅ Use existing file name
        location: 'tech-workshop.jpg', // ✅ Use existing file name
      },
    },
    {
      name: 'Environmental Cleanup',
      description: 'Join us in cleaning the local beach',
      categoryKey: 'environment',
      location: 'Sunset Beach',
      dateTime: new Date('2025-07-03T08:00:00Z'),
      key: 'environmentalCleanup',
      images: {
        profile: 'environmental-cleanup.png', // ✅ Use existing file name
        cover: 'environmental-cleanup.png', // ✅ Use existing file name
        location: 'environmental-cleanup.png', // ✅ Use existing file name
      },
    },
    {
      name: 'Upcoming Hackathon',
      description: 'A 48-hour coding competition',
      categoryKey: 'technology',
      location: 'Tech Hub',
      dateTime: new Date('2025-08-15T10:00:00Z'),
      key: 'hackathon',
      images: {
        profile: 'hackathon.png', // ✅ Use existing file name
        cover: 'hackathon.png', // ✅ Use existing file name
        location: 'hackathon.png', // ✅ Use existing file name
      },
    },
  ];

  const events = {};

  for (const eventData of eventsData) {
    try {
      // Get the fallback images path
      const fallbackImagePath = join(__dirname, '../assets/images/events');

      // ✅ Explicitly type the upload result variables
      let profileResult: UploadResult | null = null;
      let coverResult: UploadResult | null = null;
      let locationResult: UploadResult | null = null;

      try {
        const profilePath = join(fallbackImagePath, eventData.images.profile);
        const coverPath = join(fallbackImagePath, eventData.images.cover);
        const locationPath = join(fallbackImagePath, eventData.images.location);

        [profileResult, coverResult, locationResult] = await Promise.all([
          uploader
            .uploadImageFromFile(
              profilePath,
              'events',
              eventData.images.profile,
            )
            .catch(() => null),
          uploader
            .uploadImageFromFile(coverPath, 'events', eventData.images.cover)
            .catch(() => null),
          uploader
            .uploadImageFromFile(
              locationPath,
              'events',
              eventData.images.location,
            )
            .catch(() => null),
        ]);
      } catch (error) {
        console.log(
          `⚠️ Image upload failed for ${eventData.name}, using defaults`,
        );
      }

      // Create event with MinIO image URLs or defaults
      const event = await createEvent(prisma, {
        name: eventData.name,
        description: eventData.description,
        organizerId: users.organizer.id,
        categoryId: categories[eventData.categoryKey].id,
        location: eventData.location,
        dateTime: eventData.dateTime,
        status: EventStatus.PUBLISHED,
        acceptingVolunteers: true,
        profileImage: profileResult?.thumbnailUrl || 'default-event.jpg',
        coverImage: coverResult?.originalUrl || 'default-event.jpg',
        locationImage: locationResult?.thumbnailUrl || 'default-event.jpg',
      });

      // Use the predefined key instead of generating one
      events[eventData.key] = event;

      console.log(`✅ Event "${eventData.name}" created with MinIO images`);
    } catch (error) {
      console.error(
        `❌ Error creating event "${eventData.name}":`,
        error.message,
      );

      // Fallback: create event with default images
      try {
        const event = await createEvent(prisma, {
          name: eventData.name,
          description: eventData.description,
          organizerId: users.organizer.id,
          categoryId: categories[eventData.categoryKey].id,
          location: eventData.location,
          dateTime: eventData.dateTime,
          status: EventStatus.PUBLISHED,
          acceptingVolunteers: true,
          profileImage: 'default-event.jpg',
          coverImage: 'default-event.jpg',
          locationImage: 'default-event.jpg',
        });

        events[eventData.key] = event;
        console.log(`✅ Event "${eventData.name}" created with default images`);
      } catch (fallbackError) {
        console.error(
          `❌ Failed to create event "${eventData.name}" even with defaults:`,
          fallbackError.message,
        );
      }
    }
  }

  console.log('Events seeded successfully');
  console.log('✅ Available events:', Object.keys(events));
  return events;
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
