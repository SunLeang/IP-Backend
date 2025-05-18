import { PrismaClient } from '@prisma/client';
import { seedUsers } from './data/users';
import { seedCategories } from './data/categories';
import { seedEvents } from './data/events';
import { seedAnnouncements } from './data/announcements';
import { seedInterests } from './data/interests';
import { seedAttendances } from './data/attendances';
import { seedVolunteers } from './data/volunteers';
import { seedTasks } from './data/tasks';
import { seedNotifications } from './data/notifications';
import { seedComments } from './data/comments';
import { seedRefreshTokens } from './data/refresh-tokens';
import { seedCertificates } from './data/certificates';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

async function main() {
  // Check if specific seed types are requested
  const args = process.argv.slice(2);
  const seedTypes = args.length > 0 ? args : null;

  console.log('Starting database seeding...');
  console.log(
    seedTypes
      ? `Seeding specific types: ${seedTypes.join(', ')}`
      : 'Seeding all data types',
  );

  try {
    // Clear existing data (if not in selective mode or if --keep-existing not specified)
    if (!seedTypes || !args.includes('--keep-existing')) {
      await clearDatabase();
    }

    // Seed data in order of dependencies
    // First seed base entities that don't depend on anything else
    const users = seedTypes
      ? seedTypes.includes('users')
        ? await seedUsers(prisma)
        : await getExistingUsers()
      : await seedUsers(prisma);

    const categories = seedTypes
      ? seedTypes.includes('categories')
        ? await seedCategories(prisma)
        : await getExistingCategories()
      : await seedCategories(prisma);

    // Then seed entities that depend on base entities
    const events = seedTypes
      ? seedTypes.includes('events')
        ? await seedEvents(prisma, users, categories)
        : await getExistingEvents()
      : await seedEvents(prisma, users, categories);

    const tasks = seedTypes
      ? seedTypes.includes('tasks')
        ? await seedTasks(prisma, events)
        : await getExistingTasks()
      : await seedTasks(prisma, events);

    const announcements = seedTypes
      ? seedTypes.includes('announcements')
        ? await seedAnnouncements(prisma, events)
        : await getExistingAnnouncements()
      : await seedAnnouncements(prisma, events);

    // Then seed relationship entities
    if (!seedTypes || seedTypes.includes('interests')) {
      await seedInterests(prisma, users, events);
    }

    if (!seedTypes || seedTypes.includes('attendances')) {
      await seedAttendances(prisma, users, events);
    }

    const applications =
      !seedTypes || seedTypes.includes('volunteers')
        ? await seedVolunteers(prisma, users, events)
        : await getExistingApplications();

    if (!seedTypes || seedTypes.includes('comments')) {
      await seedComments(prisma, users, events);
    }

    if (!seedTypes || seedTypes.includes('certificates')) {
      await seedCertificates(prisma, users, events);
    }

    // Finally, seed entities that depend on many other entities
    if (!seedTypes || seedTypes.includes('notifications')) {
      await seedNotifications(
        prisma,
        users,
        events,
        announcements,
        applications,
      );
    }

    if (!seedTypes || seedTypes.includes('refresh-tokens')) {
      await seedRefreshTokens(prisma, users);
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding process:', error);
    throw error;
  }
}

// Helper functions to get existing data when selective seeding
async function getExistingUsers() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: 'admin@example.com' },
        { email: 'superadmin@example.com' },
        { email: 'organizer@example.com' },
        { email: 'regular.user.1@example.com' },
        { email: 'regular.user.2@example.com' },
        { email: 'regular.user.3@example.com' },
      ],
    },
  });

  if (users.length === 0) {
    throw new Error('No existing users found. Please seed users first.');
  }

  return {
    admin: users.find((u) => u.email === 'admin@example.com'),
    superAdmin: users.find((u) => u.email === 'superadmin@example.com'),
    organizer: users.find((u) => u.email === 'organizer@example.com'),
    regularUser1: users.find((u) => u.email === 'regular.user.1@example.com'),
    regularUser2: users.find((u) => u.email === 'regular.user.2@example.com'),
    regularUser3: users.find((u) => u.email === 'regular.user.3@example.com'),
  };
}

async function getExistingCategories() {
  const categories = await prisma.eventCategory.findMany({
    where: {
      name: { in: ['Charity', 'Education', 'Technology', 'Environment'] },
    },
  });

  if (categories.length === 0) {
    throw new Error(
      'No existing categories found. Please seed categories first.',
    );
  }

  return {
    charity: categories.find((c) => c.name === 'Charity'),
    education: categories.find((c) => c.name === 'Education'),
    technology: categories.find((c) => c.name === 'Technology'),
    environment: categories.find((c) => c.name === 'Environment'),
  };
}

async function getExistingEvents() {
  const events = await prisma.event.findMany({
    take: 4,
    orderBy: { id: 'desc' },
  });

  if (events.length < 3) {
    throw new Error(
      'Not enough existing events found. Please seed events first.',
    );
  }

  return {
    charityRun: events[0],
    techWorkshop: events[1],
    environmentalCleanup: events[2],
    hackathon: events[3] || events[2],
  };
}

async function getExistingTasks() {
  const tasks = await prisma.task.findMany({
    take: 5,
    orderBy: { id: 'desc' },
  });

  return {
    registrationSetup: tasks[0],
    routeMarking: tasks[1],
    equipmentSetup: tasks[2],
    prepareHandouts: tasks[3],
    distributeEquipment: tasks[4],
  };
}

async function getExistingAnnouncements() {
  const announcements = await prisma.announcement.findMany({
    take: 4,
    orderBy: { id: 'desc' },
  });

  return {
    charityRunUpdate: announcements[0],
    newSpeaker: announcements[1],
    cleanupEquipment: announcements[2],
    weatherAdvisory: announcements[3],
  };
}

async function getExistingApplications() {
  const applications = await prisma.volunteerApplication.findMany({
    take: 4,
    orderBy: {
      id: 'desc',
    },
  });

  return {
    pendingApplication: applications[0],
    approvedTechWorkshop: applications[1],
    rejectedApplication: applications[2],
    approvedHackathon: applications[3],
  };
}

// Function to clear database (use with caution)
async function clearDatabase() {
  // Delete in reverse order of dependencies
  console.log('Clearing existing data...');

  try {
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({}),
      prisma.notification.deleteMany({}),
      prisma.certificate.deleteMany({}),
      prisma.commentRating.deleteMany({}),
      prisma.taskAssignment.deleteMany({}),
      prisma.task.deleteMany({}),
      prisma.eventInterest.deleteMany({}),
      prisma.eventAttendance.deleteMany({}),
      prisma.eventVolunteer.deleteMany({}),
      prisma.volunteerApplication.deleteMany({}),
      prisma.announcement.deleteMany({}),
      prisma.event.deleteMany({}),
      prisma.eventCategory.deleteMany({}),
      prisma.user.deleteMany({}),
    ]);

    console.log('Existing data cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw new Error(`Failed to clear database: ${error.message}`);
  }
}

main()
  .catch((e) => {
    console.error('Fatal error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  });
