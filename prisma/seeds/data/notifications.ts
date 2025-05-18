import { PrismaClient, NotificationType } from '@prisma/client';

export async function seedNotifications(
  prisma: PrismaClient,
  users: any,
  events: any,
  announcements: any,
  applications: any,
) {
  console.log('Seeding notifications...');

  // Announcement notifications
  await createNotification(prisma, {
    userId: users.regularUser1.id,
    type: NotificationType.ANNOUNCEMENT,
    message: 'New announcement for Charity Run: Important Update',
    eventId: events.charityRun.id,
    announcementId: announcements.charityRunUpdate.id,
  });

  await createNotification(prisma, {
    userId: users.regularUser2.id,
    type: NotificationType.ANNOUNCEMENT,
    message: 'New announcement for Charity Run: Important Update',
    eventId: events.charityRun.id,
    announcementId: announcements.charityRunUpdate.id,
    read: true,
  });

  await createNotification(prisma, {
    userId: users.regularUser1.id,
    type: NotificationType.ANNOUNCEMENT,
    message: 'New announcement for Tech Workshop: New Speaker Added',
    eventId: events.techWorkshop.id,
    announcementId: announcements.newSpeaker.id,
  });

  // Application notifications
  await createNotification(prisma, {
    userId: users.organizer.id,
    type: NotificationType.APPLICATION_UPDATE,
    message: `New volunteer application from ${users.regularUser1.fullName}`,
    eventId: events.charityRun.id,
    applicationId: applications.pendingApplication.id,
  });

  await createNotification(prisma, {
    userId: users.regularUser2.id,
    type: NotificationType.APPLICATION_UPDATE,
    message: 'Your volunteer application for Tech Workshop has been approved!',
    eventId: events.techWorkshop.id,
    applicationId: applications.approvedTechWorkshop.id,
    read: true,
  });

  await createNotification(prisma, {
    userId: users.regularUser3.id,
    type: NotificationType.APPLICATION_UPDATE,
    message:
      'Your volunteer application for Environmental Cleanup was not approved at this time.',
    eventId: events.environmentalCleanup.id,
    applicationId: applications.rejectedApplication.id,
  });

  // Event reminder notifications
  await createNotification(prisma, {
    userId: users.regularUser1.id,
    type: NotificationType.EVENT_REMINDER,
    message: 'Reminder: Charity Run is tomorrow!',
    eventId: events.charityRun.id,
  });

  await createNotification(prisma, {
    userId: users.regularUser2.id,
    type: NotificationType.EVENT_REMINDER,
    message: 'Reminder: Tech Workshop starts in 2 days.',
    eventId: events.techWorkshop.id,
  });

  // Task assignment notifications
  await createNotification(prisma, {
    userId: users.regularUser2.id,
    type: NotificationType.TASK_ASSIGNMENT,
    message: 'You have been assigned to the "Equipment Setup" task.',
    eventId: events.techWorkshop.id,
  });

  // System alert
  await createNotification(prisma, {
    userId: users.regularUser1.id,
    type: NotificationType.SYSTEM_ALERT,
    message: 'Your profile has been successfully updated.',
  });

  console.log('Notifications seeded successfully');
}

async function createNotification(prisma: PrismaClient, data: any) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      message: data.message,
      read: data.read || false,
      ...(data.eventId && { eventId: data.eventId }),
      ...(data.announcementId && { announcementId: data.announcementId }),
      ...(data.applicationId && { applicationId: data.applicationId }),
    },
  });
}
