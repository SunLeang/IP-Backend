import {
  PrismaClient,
  ApplicationStatus,
  VolunteerStatus,
} from '@prisma/client';

export async function seedVolunteers(
  prisma: PrismaClient,
  users: any,
  events: any,
) {
  console.log('Seeding volunteer applications and event volunteers...');

  // Create applications
  const application1 = await createApplication(prisma, {
    userId: users.regularUser1.id,
    eventId: events.charityRun.id,
    whyVolunteer:
      'I am passionate about helping the community and have experience in organizing running events.',
    cvPath: 'user1_cv.pdf',
    status: ApplicationStatus.PENDING,
  });

  const application2 = await createApplication(prisma, {
    userId: users.regularUser2.id,
    eventId: events.techWorkshop.id,
    whyVolunteer:
      'I have technical skills I would like to share with the community.',
    cvPath: 'user2_cv.pdf',
    status: ApplicationStatus.APPROVED,
    processedAt: new Date(new Date().setDate(new Date().getDate() - 3)),
  });

  const application3 = await createApplication(prisma, {
    userId: users.regularUser3.id,
    eventId: events.environmentalCleanup.id,
    whyVolunteer:
      'I am an environmental science student and would love to contribute to this cleanup effort.',
    cvPath: 'user3_cv.pdf',
    status: ApplicationStatus.REJECTED,
    processedAt: new Date(new Date().setDate(new Date().getDate() - 5)),
  });

  const application4 = await createApplication(prisma, {
    userId: users.regularUser1.id,
    eventId: events.hackathon.id,
    whyVolunteer:
      'I would like to help organize the hackathon as I have participated in many before.',
    cvPath: 'user1_hackathon_cv.pdf',
    status: ApplicationStatus.APPROVED,
    processedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
  });

  // Create event volunteers (for approved applications)
  await createEventVolunteer(prisma, {
    userId: users.regularUser2.id,
    eventId: events.techWorkshop.id,
    status: VolunteerStatus.APPROVED,
    approvedAt: new Date(new Date().setDate(new Date().getDate() - 3)),
  });

  await createEventVolunteer(prisma, {
    userId: users.regularUser1.id,
    eventId: events.hackathon.id,
    status: VolunteerStatus.APPROVED,
    approvedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
  });

  console.log(
    'Volunteer applications and event volunteers seeded successfully',
  );

  return {
    pendingApplication: application1,
    approvedTechWorkshop: application2,
    rejectedApplication: application3,
    approvedHackathon: application4,
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
