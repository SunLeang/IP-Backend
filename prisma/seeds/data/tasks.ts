import { PrismaClient, TaskStatus } from '@prisma/client';

export async function seedTasks(prisma: PrismaClient, events: any) {
  console.log('Seeding tasks across all events...');

  // 🎯 ORGANIZER 1 EVENTS TASKS

  // Kizuna 2025 tasks
  const task1 = await createTask(prisma, {
    name: 'Cultural Setup',
    description: 'Set up traditional Japanese decorations and booths',
    eventId: events.kizunaRun.id,
    type: 'Setup',
    dueDate: new Date('2025-06-15T07:00:00Z'),
    status: TaskStatus.COMPLETED,
  });

  const task2 = await createTask(prisma, {
    name: 'Registration Management',
    description: 'Handle participant registration and welcome',
    eventId: events.kizunaRun.id,
    type: 'Registration',
    dueDate: new Date('2025-06-15T08:00:00Z'),
    status: TaskStatus.COMPLETED,
  });

  // Tanabata Festival tasks
  const task3 = await createTask(prisma, {
    name: 'Star Decoration Setup',
    description: 'Hang star decorations and prepare wish tree',
    eventId: events.tanabataFestival.id,
    type: 'Decoration',
    dueDate: new Date('2025-07-13T11:00:00Z'),
    status: TaskStatus.PENDING,
  });

  // 🎯 ORGANIZER 2 EVENTS TASKS

  // Dance Show tasks
  const task4 = await createTask(prisma, {
    name: 'Stage Preparation',
    description: 'Set up stage, lighting, and sound equipment',
    eventId: events.danceShow.id,
    type: 'Technical',
    dueDate: new Date('2025-07-03T06:00:00Z'),
    status: TaskStatus.IN_PROGRESS,
  });

  const task5 = await createTask(prisma, {
    name: 'Costume Organization',
    description: 'Organize and prepare traditional dance costumes',
    eventId: events.danceShow.id,
    type: 'Preparation',
    dueDate: new Date('2025-07-02T18:00:00Z'),
    status: TaskStatus.COMPLETED,
  });

  // Science Days tasks
  const task6 = await createTask(prisma, {
    name: 'Lab Equipment Setup',
    description: 'Set up science experiment stations and equipment',
    eventId: events.scienceDays.id,
    type: 'Technical',
    dueDate: new Date('2025-08-15T08:00:00Z'),
    status: TaskStatus.PENDING,
  });

  const task7 = await createTask(prisma, {
    name: 'Educational Material Prep',
    description: 'Prepare handouts and educational materials',
    eventId: events.scienceDays.id,
    type: 'Content',
    dueDate: new Date('2025-08-14T17:00:00Z'),
    status: TaskStatus.PENDING,
  });

  // Tena Concert tasks
  const task8 = await createTask(prisma, {
    name: 'Sound Check',
    description: 'Test all audio equipment and microphones',
    eventId: events.tenaConcert.id,
    type: 'Technical',
    dueDate: new Date('2025-07-20T11:00:00Z'),
    status: TaskStatus.PENDING,
  });

  // Peace March tasks
  const task9 = await createTask(prisma, {
    name: 'Route Coordination',
    description: 'Coordinate with authorities and mark the march route',
    eventId: events.peaceMarch.id,
    type: 'Coordination',
    dueDate: new Date('2025-06-30T10:00:00Z'),
    status: TaskStatus.IN_PROGRESS,
  });

  console.log('Tasks seeded successfully across all events');
  console.log('📊 Task distribution:');
  console.log('  - Organizer 1 events: 3 tasks');
  console.log('  - Organizer 2 events: 6 tasks');

  return {
    culturalSetup: task1,
    registrationMgmt: task2,
    starDecoration: task3,
    stagePrep: task4,
    costumeOrg: task5,
    labSetup: task6,
    educationalPrep: task7,
    soundCheck: task8,
    routeCoord: task9,
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
