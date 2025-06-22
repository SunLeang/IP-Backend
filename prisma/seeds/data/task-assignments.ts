import { PrismaClient } from '@prisma/client';

export async function seedTaskAssignments(
  prisma: PrismaClient,
  users: any,
  tasks: any,
) {
  console.log('Seeding task assignments...');

  // ✅ Check if we have the required tasks and users from our current seed data
  if (!tasks.culturalSetup || !tasks.stagePrep || !tasks.routeCoord) {
    console.log('Some tasks not available for assignment seeding');
    return {};
  }

  if (!users.regularUser2 || !users.regularUser4 || !users.regularUser6) {
    console.log('Required users not available for assignment seeding');
    return {};
  }

  // First, make sure the users are volunteers for the events (should already be done in volunteers.ts)
  // But let's add them just in case with skipDuplicates
  await prisma.eventVolunteer.createMany({
    data: [
      {
        userId: users.regularUser2.id, // Daro - Kizuna volunteer
        eventId: tasks.culturalSetup.eventId,
        status: 'APPROVED',
        approvedAt: new Date('2025-06-10T10:00:00Z'),
      },
      {
        userId: users.regularUser4.id, // Meng Hour - Dance Show volunteer
        eventId: tasks.stagePrep.eventId,
        status: 'APPROVED',
        approvedAt: new Date('2025-06-28T16:00:00Z'),
      },
      {
        userId: users.regularUser6.id, // Wathrak - Peace March volunteer
        eventId: tasks.routeCoord.eventId,
        status: 'APPROVED',
        approvedAt: new Date('2025-06-25T11:00:00Z'),
      },
    ],
    skipDuplicates: true,
  });

  // ✅ Create task assignments with only valid fields
  const assignment1 = await prisma.taskAssignment.create({
    data: {
      task: { connect: { id: tasks.culturalSetup.id } },
      volunteer: { connect: { id: users.regularUser2.id } }, // Daro
      assignedBy: { connect: { id: users.organizer1.id } },
      status: 'COMPLETED',
      // ❌ Removed completedAt and notes as they don't exist in schema
    },
  });

  const assignment2 = await prisma.taskAssignment.create({
    data: {
      task: { connect: { id: tasks.stagePrep.id } },
      volunteer: { connect: { id: users.regularUser4.id } }, // Meng Hour
      assignedBy: { connect: { id: users.organizer2.id } },
      status: 'IN_PROGRESS',
      // ❌ Removed notes as it doesn't exist in schema
    },
  });

  const assignment3 = await prisma.taskAssignment.create({
    data: {
      task: { connect: { id: tasks.routeCoord.id } },
      volunteer: { connect: { id: users.regularUser6.id } }, // Wathrak
      assignedBy: { connect: { id: users.organizer2.id } },
      status: 'IN_PROGRESS',
      // ❌ Removed notes as it doesn't exist in schema
    },
  });

  const assignment4 = await prisma.taskAssignment.create({
    data: {
      task: { connect: { id: tasks.registrationMgmt.id } },
      volunteer: { connect: { id: users.regularUser2.id } }, // Daro
      assignedBy: { connect: { id: users.organizer1.id } },
      status: 'COMPLETED',
      // ❌ Removed completedAt and notes as they don't exist in schema
    },
  });

  console.log('Task assignments seeded successfully');
  console.log('📊 Task assignment distribution:');
  console.log('  - Daro: 2 assignments (Kizuna event)');
  console.log('  - Meng Hour: 1 assignment (Dance Show)');
  console.log('  - Wathrak: 1 assignment (Peace March)');

  return {
    culturalSetupAssignment: assignment1,
    stagePrepAssignment: assignment2,
    routeCoordAssignment: assignment3,
    registrationAssignment: assignment4,
  };
}
