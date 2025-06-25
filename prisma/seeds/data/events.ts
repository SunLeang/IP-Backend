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
    // ORGANIZER 1 EVENTS (2 events)
    {
      name: 'Kizuna 2025',
      description: 'មហោស្រពគីហ្សូណាជប៉ុន-កម្ពុជាឆ្នាំ២០២៥',
      categoryKey: 'traditional',
      organizerKey: 'organizer1',
      location: 'CJCC',
      dateTime: new Date('2025-06-15T09:00:00Z'),
      key: 'kizunaRun',
      images: {
        profile: 'Kizuna.jpg',
        cover: 'kizuna_cover.jpg',
        location: 'kizuna_location.png',
      },
    },
    {
      name: 'Tanabata Festival 2025',
      description: 'ពិធីបុណ្យផ្កាយឆ្នាំ ២០២៤',
      categoryKey: 'environment',
      organizerKey: 'organizer1',
      location: 'CJCC',
      dateTime: new Date('2025-07-13T13:00:00Z'),
      key: 'tanabataFestival',
      images: {
        profile: 'Tanabata.jpg',
        cover: 'Tanabata_cover.jpg',
        location: 'Tanabat_location.jpg',
      },
    },
    // ORGANIZER 2 EVENTS (4 events)
    {
      name: 'Cambodian Traditional Dance Show',
      description:
        'The abduction of Sita 👑 An extract from the Cambodian Ramayana...',
      categoryKey: 'traditional',
      organizerKey: 'organizer2',
      location: 'Koh Pich',
      dateTime: new Date('2025-07-03T08:00:00Z'),
      key: 'danceShow',
      images: {
        profile: 'sarovan.jpg',
        cover: 'sarovan.jpg',
        location: 'sarovan_location.png',
      },
    },
    {
      name: 'Scientific Days 2025',
      description: 'A scientific event to promote STEM education',
      categoryKey: 'education',
      organizerKey: 'organizer2',
      location: 'ITC',
      dateTime: new Date('2025-08-15T10:00:00Z'),
      key: 'scienceDays',
      images: {
        profile: 'science.jpg',
        cover: 'science_cover.jpg',
        location: 'science_location.png',
      },
    },
    {
      name: 'Melody of Love - Tena Concert',
      description: 'Tena Concert 2025',
      categoryKey: 'entertainment',
      organizerKey: 'organizer2',
      location: 'Aeon SenSok',
      dateTime: new Date('2025-07-20T13:00:00Z'),
      key: 'tenaConcert',
      images: {
        profile: 'melody.jpg',
        cover: 'melody_cover.jpg',
        location: 'melody_location.png',
      },
    },
    {
      name: 'Solidarity March',
      description: 'Solidarity March for Peace and Unity of Cambodia',
      categoryKey: 'environment',
      organizerKey: 'organizer2',
      location: 'Monument of Independence',
      dateTime: new Date('2025-06-30T13:00:00Z'),
      key: 'peaceMarch',
      images: {
        profile: 'march.jpg',
        cover: 'march_cover.jpg',
        location: 'march_location.png',
      },
    },
  ];

  const events = {};

  for (const eventData of eventsData) {
    try {
      // Get the correct organizer
      const organizerId = users[eventData.organizerKey].id;

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

      // Create event with the assigned organizer
      const event = await createEvent(prisma, {
        name: eventData.name,
        description: eventData.description,
        organizerId: organizerId, // ✅ Use correct organizer
        categoryId: categories[eventData.categoryKey].id,
        location: eventData.location,
        dateTime: eventData.dateTime,
        status: EventStatus.PUBLISHED,
        acceptingVolunteers: true,
        profileImage: profileResult?.thumbnailUrl || 'default-event.jpg',
        coverImage: coverResult?.originalUrl || 'default-event.jpg',
        locationImage: locationResult?.originalUrl || 'default-event.jpg',
      });

      events[eventData.key] = event;
      console.log(
        `✅ Event "${eventData.name}" created by ${eventData.organizerKey}`,
      );
    } catch (error) {
      console.error(
        `❌ Error creating event "${eventData.name}":`,
        error.message,
      );
    }
  }

  console.log('Events seeded successfully');
  console.log('📊 Event distribution:');
  console.log('  - Organizer 1: Kizuna 2025, Tanabata Festival');
  console.log(
    '  - Organizer 2: Dance Show, Science Days, Tena Concert, Solidarity March',
  );
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
