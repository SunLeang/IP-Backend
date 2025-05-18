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
  // Get the seed type and options
  const args = process.argv.slice(2);
  const seedType = args[0];
  const clearData = args.includes('--clear');

  if (!seedType) {
    console.error(
      'Please specify a seed type (users, categories, events, etc.)',
    );
    printUsage();
    process.exit(1);
  }

  console.log(`Running seed: ${seedType}`);

  if (clearData) {
    console.log('Clearing existing data before seeding...');
    await clearDatabase();
  }

  try {
    switch (seedType.toLowerCase()) {
      case 'users':
        await seedUsers(prisma);
        break;

      case 'categories':
        await seedCategories(prisma);
        break;

      case 'events':
        // Events depend on users and categories
        console.log(
          'Seeding events requires users and categories. Getting dependencies...',
        );
        const users = clearData
          ? await seedUsers(prisma)
          : await getExistingUsers();
        const categories = clearData
          ? await seedCategories(prisma)
          : await getExistingCategories();
        await seedEvents(prisma, users, categories);
        break;

      case 'tasks':
        // Tasks depend on events
        console.log('Seeding tasks requires events. Getting dependencies...');
        const eventsForTasks = await getExistingEvents();
        await seedTasks(prisma, eventsForTasks);
        break;

      case 'announcements':
        // Announcements depend on events
        console.log(
          'Seeding announcements requires events. Getting dependencies...',
        );
        const eventsForAnnouncements = await getExistingEvents();
        await seedAnnouncements(prisma, eventsForAnnouncements);
        break;

      case 'interests':
        // Interests depend on users and events
        console.log(
          'Seeding interests requires users and events. Getting dependencies...',
        );
        const usersForInterests = await getExistingUsers();
        const eventsForInterests = await getExistingEvents();
        await seedInterests(prisma, usersForInterests, eventsForInterests);
        break;

      case 'attendances':
        // Attendances depend on users and events
        console.log(
          'Seeding attendances requires users and events. Getting dependencies...',
        );
        const usersForAttendances = await getExistingUsers();
        const eventsForAttendances = await getExistingEvents();
        await seedAttendances(
          prisma,
          usersForAttendances,
          eventsForAttendances,
        );
        break;

      case 'volunteers':
        // Volunteers depend on users and events
        console.log(
          'Seeding volunteers requires users and events. Getting dependencies...',
        );
        const usersForVolunteers = await getExistingUsers();
        const eventsForVolunteers = await getExistingEvents();
        await seedVolunteers(prisma, usersForVolunteers, eventsForVolunteers);
        break;

      case 'comments':
        // Comments depend on users and events
        console.log(
          'Seeding comments requires users and events. Getting dependencies...',
        );
        const usersForComments = await getExistingUsers();
        const eventsForComments = await getExistingEvents();
        await seedComments(prisma, usersForComments, eventsForComments);
        break;

      case 'certificates':
        // Certificates depend on users and events
        console.log(
          'Seeding certificates requires users and events. Getting dependencies...',
        );
        const usersForCertificates = await getExistingUsers();
        const eventsForCertificates = await getExistingEvents();
        await seedCertificates(
          prisma,
          usersForCertificates,
          eventsForCertificates,
        );
        break;

      case 'notifications':
        // Notifications depend on users, events, announcements, and applications
        console.log(
          'Seeding notifications requires multiple dependencies. Getting dependencies...',
        );
        const usersForNotifications = await getExistingUsers();
        const eventsForNotifications = await getExistingEvents();
        const announcements = await getExistingAnnouncements();
        const applications = await getExistingApplications();
        await seedNotifications(
          prisma,
          usersForNotifications,
          eventsForNotifications,
          announcements,
          applications,
        );
        break;

      case 'refresh-tokens':
        // Refresh tokens depend on users
        console.log(
          'Seeding refresh tokens requires users. Getting dependencies...',
        );
        const usersForTokens = await getExistingUsers();
        await seedRefreshTokens(prisma, usersForTokens);
        break;

      case 'all':
        // Seed everything in the right order
        console.log('Seeding all data...');
        await clearDatabase();
        await runFullSeed();
        break;

      default:
        console.error(`Unknown seed type: ${seedType}`);
        printUsage();
        process.exit(1);
    }

    console.log(`Seed complete: ${seedType}`);
  } catch (error) {
    console.error(`Error during seeding ${seedType}:`, error);
    process.exit(1);
  }
}

async function runFullSeed() {
  // This function seeds everything in the correct order
  const users = await seedUsers(prisma);
  const categories = await seedCategories(prisma);
  const events = await seedEvents(prisma, users, categories);
  const tasks = await seedTasks(prisma, events);
  const announcements = await seedAnnouncements(prisma, events);
  await seedInterests(prisma, users, events);
  await seedAttendances(prisma, users, events);
  const applications = await seedVolunteers(prisma, users, events);
  await seedComments(prisma, users, events);
  await seedCertificates(prisma, users, events);
  await seedNotifications(prisma, users, events, announcements, applications);
  await seedRefreshTokens(prisma, users);
}

// Helper functions from index.ts
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
    throw new Error(
      'No existing users found. Please seed users first with: npm run seed:users',
    );
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
      'No existing categories found. Please seed categories first with: npm run seed:categories',
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
      'Not enough existing events found. Please seed events first with: npm run seed:events',
    );
  }

  return {
    charityRun: events[0],
    techWorkshop: events[1],
    environmentalCleanup: events[2],
    hackathon: events[3] || events[2], // Fallback if only 3 events
  };
}

async function getExistingAnnouncements() {
  const announcements = await prisma.announcement.findMany({
    take: 4,
    orderBy: { id: 'desc' },
  });

  if (announcements.length === 0) {
    throw new Error(
      'No existing announcements found. Please seed announcements first with: npm run seed:announcements',
    );
  }

  return {
    charityRunUpdate: announcements[0],
    newSpeaker: announcements[1],
    cleanupEquipment: announcements[2],
    weatherAdvisory: announcements[3] || announcements[0], // Fallback if fewer than 4
  };
}

async function getExistingApplications() {
  const applications = await prisma.volunteerApplication.findMany({
    take: 4,
    orderBy: {
      id: 'desc',
    },
  });

  if (applications.length === 0) {
    throw new Error(
      'No existing volunteer applications found. Please seed volunteers first with: npm run seed:volunteers',
    );
  }

  return {
    pendingApplication: applications[0],
    approvedTechWorkshop: applications[1] || applications[0],
    rejectedApplication: applications[2] || applications[0],
    approvedHackathon: applications[3] || applications[0],
  };
}

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

function printUsage() {
  console.log(`
Usage: npm run seed:<type> [-- --clear]

Available seed types:
  users           - Seed user data
  categories      - Seed event categories
  events          - Seed events (depends on users and categories)
  tasks           - Seed tasks (depends on events)
  announcements   - Seed announcements (depends on events)
  interests       - Seed event interests (depends on users and events)
  attendances     - Seed event attendances (depends on users and events)
  volunteers      - Seed volunteer applications (depends on users and events)
  comments        - Seed comments and ratings (depends on users and events)
  certificates    - Seed certificates (depends on users and events)
  notifications   - Seed notifications (depends on users, events, announcements, applications)
  refresh-tokens  - Seed refresh tokens (depends on users)
  all             - Seed all data in the correct order (clears database first)

Options:
  --clear         - Clear existing data before seeding
  `);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  });
