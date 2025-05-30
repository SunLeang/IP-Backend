import { PrismaClient, TaskStatus } from '@prisma/client';

export async function seedTaskAssignments(
  prisma: PrismaClient,
  users: any,
  tasks: any,
) {
  console.log('Seeding task assignments...');

  // Check if we have the required tasks and users
  if (
    !tasks.equipmentSetup ||
    !tasks.prepareHandouts ||
    !tasks.mentorCoordination
  ) {
    console.log('Some tasks not available for assignment seeding');
    return {};
  }

  if (!users.regularUser1 || !users.regularUser2) {
    console.log('Required users not available for assignment seeding');
    return {};
  }

  // First, make sure the users are volunteers for the events
  await prisma.eventVolunteer.createMany({
    data: [
      {
        userId: users.regularUser1.id,
        eventId: tasks.mentorCoordination.eventId, // hackathon event
        status: 'APPROVED',
        approvedAt: new Date(),
      },
      {
        userId: users.regularUser2.id,
        eventId: tasks.equipmentSetup.eventId, // tech workshop event
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  // Now create task assignments
  const assignment1 = await prisma.taskAssignment.create({
    data: {
      task: { connect: { id: tasks.equipmentSetup.id } },
      volunteer: { connect: { id: users.regularUser2.id } },
      assignedBy: { connect: { id: users.organizer.id } },
      status: 'IN_PROGRESS',
    },
  });

  const assignment2 = await prisma.taskAssignment.create({
    data: {
      task: { connect: { id: tasks.prepareHandouts.id } },
      volunteer: { connect: { id: users.regularUser2.id } },
      assignedBy: { connect: { id: users.organizer.id } },
      status: 'COMPLETED',
    },
  });

  const assignment3 = await prisma.taskAssignment.create({
    data: {
      task: { connect: { id: tasks.mentorCoordination.id } },
      volunteer: { connect: { id: users.regularUser1.id } },
      assignedBy: { connect: { id: users.organizer.id } },
      status: 'PENDING',
    },
  });

  console.log('Task assignments seeded successfully');

  return {
    equipmentSetup: assignment1,
    prepareHandouts: assignment2,
    mentorCoordination: assignment3,
  };
}
