import {
  PrismaClient,
  ApplicationStatus,
  VolunteerStatus,
  CurrentRole,
} from '@prisma/client';

export async function seedVolunteers(
  prisma: PrismaClient,
  users: any,
  events: any,
) {
  console.log('Seeding volunteer applications and event volunteers...');

  // 🎯 ORGANIZER 1 EVENTS - Volunteer applications
  const app1 = await createApplication(prisma, {
    userId: users.regularUser2.id, // Daro
    eventId: events.kizunaRun.id,
    whyVolunteer:
      'I love Japanese culture and want to help organize this cultural exchange event.',
    cvPath: 'daro_kizuna_cv.pdf',
    status: ApplicationStatus.APPROVED,
    processedAt: new Date('2025-06-10T10:00:00Z'),
  });

  const app2 = await createApplication(prisma, {
    userId: users.regularUser3.id, // Seang
    eventId: events.tanabataFestival.id,
    whyVolunteer:
      'I want to help preserve and share traditional festivals with the community.',
    cvPath: 'seang_tanabata_cv.pdf',
    status: ApplicationStatus.APPROVED,
    processedAt: new Date('2025-07-08T14:00:00Z'),
  });

  // 🎯 ORGANIZER 2 EVENTS - Volunteer applications
  const app3 = await createApplication(prisma, {
    userId: users.regularUser4.id, // Meng Hour
    eventId: events.danceShow.id,
    whyVolunteer:
      'I have experience with traditional arts and want to support cultural preservation.',
    cvPath: 'hour_dance_cv.pdf',
    status: ApplicationStatus.APPROVED,
    processedAt: new Date('2025-06-28T16:00:00Z'),
  });

  const app4 = await createApplication(prisma, {
    userId: users.regularUser1.id, // Sun Leang
    eventId: events.scienceDays.id,
    whyVolunteer:
      'As a STEM student, I want to inspire young people to pursue science.',
    cvPath: 'leang_science_cv.pdf',
    status: ApplicationStatus.PENDING,
  });

  const app5 = await createApplication(prisma, {
    userId: users.regularUser5.id, // Ratanak
    eventId: events.tenaConcert.id,
    whyVolunteer: 'I have event management experience and love music events.',
    cvPath: 'ratanak_concert_cv.pdf',
    status: ApplicationStatus.REJECTED,
    processedAt: new Date('2025-07-15T12:00:00Z'),
  });

  const app6 = await createApplication(prisma, {
    userId: users.regularUser6.id, // Wathrak
    eventId: events.peaceMarch.id,
    whyVolunteer:
      'I believe in unity and want to help organize this important march.',
    cvPath: 'wathrak_march_cv.pdf',
    status: ApplicationStatus.APPROVED,
    processedAt: new Date('2025-06-25T11:00:00Z'),
  });

  // Create EventVolunteer records for approved applications
  await createEventVolunteer(prisma, {
    userId: users.regularUser2.id, // Daro - Kizuna
    eventId: events.kizunaRun.id,
    status: VolunteerStatus.APPROVED,
    approvedAt: new Date('2025-06-10T10:00:00Z'),
  });

  await createEventVolunteer(prisma, {
    userId: users.regularUser3.id, // Seang - Tanabata
    eventId: events.tanabataFestival.id,
    status: VolunteerStatus.APPROVED,
    approvedAt: new Date('2025-07-08T14:00:00Z'),
  });

  await createEventVolunteer(prisma, {
    userId: users.regularUser4.id, // Hour - Dance Show
    eventId: events.danceShow.id,
    status: VolunteerStatus.APPROVED,
    approvedAt: new Date('2025-06-28T16:00:00Z'),
  });

  await createEventVolunteer(prisma, {
    userId: users.regularUser6.id, // Wathrak - Peace March
    eventId: events.peaceMarch.id,
    status: VolunteerStatus.APPROVED,
    approvedAt: new Date('2025-06-25T11:00:00Z'),
  });

  // Update user roles for approved volunteers
  await prisma.user.updateMany({
    where: {
      id: {
        in: [
          users.regularUser2.id,
          users.regularUser3.id,
          users.regularUser4.id,
          users.regularUser6.id,
        ],
      },
    },
    data: { currentRole: CurrentRole.VOLUNTEER },
  });

  console.log(
    'Volunteer applications and event volunteers seeded successfully',
  );
  console.log('📊 Volunteer distribution:');
  console.log('  - Organizer 1 events: 2 volunteers');
  console.log('  - Organizer 2 events: 2 volunteers');
  console.log('  - Total approved volunteers: 4');

  return {
    kizunaVolunteer: app1,
    tanabataVolunteer: app2,
    danceVolunteer: app3,
    sciencePending: app4,
    concertRejected: app5,
    marchVolunteer: app6,
  };
}

async function createApplication(prisma: PrismaClient, data: any) {
  return prisma.volunteerApplication.create({
    data: {
      user: { connect: { id: data.userId } },
      event: { connect: { id: data.eventId } },
      whyVolunteer: data.whyVolunteer,
      cvPath: data.cvPath,
      status: data.status || ApplicationStatus.PENDING,
      processedAt: data.processedAt,
    },
  });
}

async function createEventVolunteer(prisma: PrismaClient, data: any) {
  return prisma.eventVolunteer.create({
    data: {
      user: { connect: { id: data.userId } },
      event: { connect: { id: data.eventId } },
      status: data.status || VolunteerStatus.PENDING_REVIEW,
      approvedAt: data.approvedAt,
    },
  });
}
