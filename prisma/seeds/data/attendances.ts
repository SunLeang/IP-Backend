import { PrismaClient, AttendanceStatus } from '@prisma/client';

export async function seedAttendances(
  prisma: PrismaClient,
  users: any,
  events: any,
) {
  console.log('Seeding event attendances...');

  // Charity Run attendances
  await createAttendance(prisma, {
    userId: users.regularUser1.id,
    eventId: events.charityRun.id,
    status: AttendanceStatus.JOINED,
    notes: 'Registered early',
    checkedInAt: new Date(new Date().setDate(new Date().getDate() - 5)),
  });

  await createAttendance(prisma, {
    userId: users.regularUser2.id,
    eventId: events.charityRun.id,
    status: AttendanceStatus.JOINED,
  });

  await createAttendance(prisma, {
    userId: users.regularUser3.id,
    eventId: events.charityRun.id,
    status: AttendanceStatus.NO_SHOW,
    notes: "Didn't show up",
  });

  // Tech Workshop attendances
  await createAttendance(prisma, {
    userId: users.regularUser1.id,
    eventId: events.techWorkshop.id,
    status: AttendanceStatus.JOINED,
    checkedInAt: new Date(new Date().setDate(new Date().getDate() - 2)),
  });

  await createAttendance(prisma, {
    userId: users.regularUser3.id,
    eventId: events.techWorkshop.id,
    status: AttendanceStatus.LEFT_EARLY,
    notes: 'Had to leave for emergency',
    checkedInAt: new Date(new Date().setDate(new Date().getDate() - 2)),
  });

  // Environmental Cleanup attendances
  await createAttendance(prisma, {
    userId: users.regularUser2.id,
    eventId: events.environmentalCleanup.id,
    status: AttendanceStatus.JOINED,
  });

  await createAttendance(prisma, {
    userId: users.organizer.id,
    eventId: events.environmentalCleanup.id,
    status: AttendanceStatus.JOINED,
    registeredBy: users.admin.id,
    notes: 'VIP guest',
    checkedInAt: new Date(new Date().setDate(new Date().getDate() - 1)),
  });

  console.log('Event attendances seeded successfully');
}

async function createAttendance(prisma: PrismaClient, data: any) {
  return prisma.eventAttendance.create({
    data: {
      user: { connect: { id: data.userId } },
      event: { connect: { id: data.eventId } },
      status: data.status || AttendanceStatus.JOINED,
      notes: data.notes,
      registeredBy: data.registeredBy,
      checkedInAt: data.checkedInAt,
    },
  });
}
