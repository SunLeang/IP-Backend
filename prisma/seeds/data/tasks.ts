import { PrismaClient, TaskStatus } from '@prisma/client';

export async function seedTasks(prisma: PrismaClient, events: any) {
  console.log('Seeding tasks...');

  // Charity Run tasks
  const task1 = await createTask(prisma, {
    name: 'Registration Setup',
    description: 'Set up registration tables and materials',
    eventId: events.charityRun.id,
    type: 'Setup',
    dueDate: new Date('2025-06-15T07:00:00Z'),
    status: TaskStatus.PENDING,
  });

  const task2 = await createTask(prisma, {
    name: 'Route Marking',
    description: 'Place markers along the run route',
    eventId: events.charityRun.id,
    type: 'Preparation',
    dueDate: new Date('2025-06-14T16:00:00Z'),
    status: TaskStatus.PENDING,
  });

  // Tech Workshop tasks
  const task3 = await createTask(prisma, {
    name: 'Equipment Setup',
    description: 'Set up computers and projectors',
    eventId: events.techWorkshop.id,
    type: 'Technical',
    dueDate: new Date('2025-05-22T11:00:00Z'),
    status: TaskStatus.IN_PROGRESS,
  });

  const task4 = await createTask(prisma, {
    name: 'Prepare Handouts',
    description: 'Print and organize workshop materials',
    eventId: events.techWorkshop.id,
    type: 'Content',
    dueDate: new Date('2025-05-21T17:00:00Z'),
    status: TaskStatus.COMPLETED,
  });

  // Environmental Cleanup tasks
  const task5 = await createTask(prisma, {
    name: 'Distribute Equipment',
    description: 'Hand out gloves, bags, and tools',
    eventId: events.environmentalCleanup.id,
    type: 'Logistics',
    dueDate: new Date('2025-07-03T08:30:00Z'),
    status: TaskStatus.PENDING,
  });

  const task6 = await createTask(prisma, {
    name: 'Site Coordination',
    description: 'Coordinate cleanup zones and safety measures',
    eventId: events.environmentalCleanup.id,
    type: 'Coordination',
    dueDate: new Date('2025-07-03T07:30:00Z'),
    status: TaskStatus.PENDING,
  });

  // Hackathon tasks
  const task7 = await createTask(prisma, {
    name: 'Mentor Coordination',
    description: 'Organize and schedule mentor sessions',
    eventId: events.hackathon.id,
    type: 'Coordination',
    dueDate: new Date('2025-08-15T09:00:00Z'),
    status: TaskStatus.PENDING,
  });

  const task8 = await createTask(prisma, {
    name: 'Prize Setup',
    description: 'Prepare and organize prizes for winners',
    eventId: events.hackathon.id,
    type: 'Setup',
    dueDate: new Date('2025-08-14T18:00:00Z'),
    status: TaskStatus.PENDING,
  });

  console.log('Tasks seeded successfully');

  return {
    registrationSetup: task1,
    routeMarking: task2,
    equipmentSetup: task3,
    prepareHandouts: task4,
    distributeEquipment: task5,
    siteCoordination: task6,
    mentorCoordination: task7,
    prizeSetup: task8,
  };
}

async function createTask(prisma: PrismaClient, data: any) {
  return prisma.task.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      dueDate: data.dueDate,
      status: data.status || TaskStatus.PENDING,
      event: { connect: { id: data.eventId } },
    },
  });
}
