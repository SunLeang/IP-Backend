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
    message: 'New announcement for Kizuna 2025: Important Update',
    eventId: events.kizunaRun.id,
    announcementId: announcements.kizunaUpdate.id,
  });

  await createNotification(prisma, {
    userId: users.regularUser2.id,
    type: NotificationType.ANNOUNCEMENT,
    message: 'New announcement for Kizuna 2025: Costume Guidelines',
    eventId: events.kizunaRun.id,
    announcementId: announcements.kizunaCostume.id,
    read: true,
  });

  await createNotification(prisma, {
    userId: users.regularUser3.id,
    type: NotificationType.ANNOUNCEMENT,
    message: 'New announcement for Tanabata Festival: Weather Update',
    eventId: events.tanabataFestival.id,
    announcementId: announcements.tanabataWeather.id,
  });

  // Application notifications
  await createNotification(prisma, {
    userId: users.organizer1.id,
    type: NotificationType.APPLICATION_UPDATE,
    message: `New volunteer application from ${users.regularUser2.fullName}`,
    eventId: events.kizunaRun.id,
    applicationId: applications.kizunaVolunteer.id,
  });

  await createNotification(prisma, {
    userId: users.regularUser2.id,
    type: NotificationType.APPLICATION_UPDATE,
    message: 'Your volunteer application for Kizuna 2025 has been approved!',
    eventId: events.kizunaRun.id,
    applicationId: applications.kizunaVolunteer.id,
    read: true,
  });

  // Event reminder notifications
  await createNotification(prisma, {
    userId: users.regularUser1.id,
    type: NotificationType.EVENT_REMINDER,
    message: 'Reminder: Kizuna 2025 is tomorrow!',
    eventId: events.kizunaRun.id,
  });

  await createNotification(prisma, {
    userId: users.regularUser3.id,
    type: NotificationType.EVENT_REMINDER,
    message: 'Reminder: Tanabata Festival starts in 2 days.',
    eventId: events.tanabataFestival.id,
  });

  // Task assignment notifications
  await createNotification(prisma, {
    userId: users.regularUser2.id,
    type: NotificationType.TASK_ASSIGNMENT,
    message: 'You have been assigned to the "Cultural Setup" task.',
    eventId: events.kizunaRun.id,
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
