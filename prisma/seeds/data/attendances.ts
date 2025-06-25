import { PrismaClient, AttendanceStatus } from '@prisma/client';

export async function seedAttendances(
  prisma: PrismaClient,
  users: any,
  events: any,
) {
  console.log('Seeding event attendances...');

  // 🎯 KIZUNA 2025 (Organizer 1) - Mixed participation
  await createAttendance(prisma, {
    userId: users.regularUser1.id, // Sun Leang
    eventId: events.kizunaRun.id,
    status: AttendanceStatus.JOINED,
    notes: 'Loved the cultural experience',
    checkedInAt: new Date('2025-06-15T08:30:00Z'),
  });

  await createAttendance(prisma, {
    userId: users.regularUser2.id, // Daro
    eventId: events.kizunaRun.id,
    status: AttendanceStatus.JOINED,
    checkedInAt: new Date('2025-06-15T08:45:00Z'),
  });

  await createAttendance(prisma, {
    userId: users.regularUser4.id, // Meng Hour
    eventId: events.kizunaRun.id,
    status: AttendanceStatus.NO_SHOW,
    notes: "Couldn't make it due to work",
  });

  // 🎯 TANABATA FESTIVAL (Organizer 1) - Good turnout
  await createAttendance(prisma, {
    userId: users.regularUser3.id, // Seang
    eventId: events.tanabataFestival.id,
    status: AttendanceStatus.JOINED,
    checkedInAt: new Date('2025-07-13T12:30:00Z'),
  });

  await createAttendance(prisma, {
    userId: users.regularUser5.id, // Ratanak
    eventId: events.tanabataFestival.id,
    status: AttendanceStatus.JOINED,
    notes: 'Beautiful star festival celebration',
    checkedInAt: new Date('2025-07-13T12:45:00Z'),
  });

  // 🎯 DANCE SHOW (Organizer 2) - Cultural enthusiasts
  await createAttendance(prisma, {
    userId: users.regularUser1.id, // Sun Leang
    eventId: events.danceShow.id,
    status: AttendanceStatus.JOINED,
    notes: 'Amazing traditional performance',
    checkedInAt: new Date('2025-07-03T07:45:00Z'),
  });

  await createAttendance(prisma, {
    userId: users.regularUser6.id, // Wathrak
    eventId: events.danceShow.id,
    status: AttendanceStatus.LEFT_EARLY,
    notes: 'Had to leave for family emergency',
    checkedInAt: new Date('2025-07-03T08:00:00Z'),
  });

  // 🎯 SCIENCE DAYS (Organizer 2) - STEM students
  await createAttendance(prisma, {
    userId: users.regularUser2.id, // Daro
    eventId: events.scienceDays.id,
    status: AttendanceStatus.JOINED,
    notes: 'Great STEM learning experience',
    checkedInAt: new Date('2025-08-15T09:30:00Z'),
  });

  await createAttendance(prisma, {
    userId: users.regularUser3.id, // Seang
    eventId: events.scienceDays.id,
    status: AttendanceStatus.JOINED,
    checkedInAt: new Date('2025-08-15T09:45:00Z'),
  });

  // 🎯 TENA CONCERT (Organizer 2) - Music lovers
  await createAttendance(prisma, {
    userId: users.regularUser4.id, // Meng Hour
    eventId: events.tenaConcert.id,
    status: AttendanceStatus.JOINED,
    notes: 'Fantastic concert!',
    checkedInAt: new Date('2025-07-20T12:30:00Z'),
  });

  await createAttendance(prisma, {
    userId: users.regularUser5.id, // Ratanak
    eventId: events.tenaConcert.id,
    status: AttendanceStatus.JOINED,
    checkedInAt: new Date('2025-07-20T12:45:00Z'),
  });

  // 🎯 SOLIDARITY MARCH (Organizer 2) - Community activists
  await createAttendance(prisma, {
    userId: users.regularUser1.id, // Sun Leang
    eventId: events.peaceMarch.id,
    status: AttendanceStatus.JOINED,
    notes: 'Proud to support unity',
    checkedInAt: new Date('2025-06-30T12:30:00Z'),
  });

  await createAttendance(prisma, {
    userId: users.regularUser6.id, // Wathrak
    eventId: events.peaceMarch.id,
    status: AttendanceStatus.JOINED,
    checkedInAt: new Date('2025-06-30T12:45:00Z'),
  });

  console.log('Event attendances seeded successfully');
  console.log('📊 Attendance distribution across all 6 events completed');
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
