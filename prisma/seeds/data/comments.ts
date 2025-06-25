import { PrismaClient, CommentStatus } from '@prisma/client';

export async function seedComments(
  prisma: PrismaClient,
  users: any,
  events: any,
) {
  console.log('Seeding comments and ratings...');

  // ✅ Only create comments for users who attended events (from attendances.ts)

  // Sun Leang attended Kizuna, Dance Show, Peace March
  await createCommentRating(prisma, {
    userId: users.regularUser1.id, // Sun Leang
    eventId: events.kizunaRun.id,
    commentText:
      'This was a fantastic cultural exchange! The Japanese-Cambodian friendship was beautifully celebrated.',
    rating: 5,
    status: CommentStatus.ACTIVE,
  });

  await createCommentRating(prisma, {
    userId: users.regularUser1.id, // Sun Leang
    eventId: events.danceShow.id,
    commentText:
      'Amazing traditional performance! The Apsara dance was mesmerizing.',
    rating: 5,
    status: CommentStatus.ACTIVE,
  });

  // Daro attended Kizuna, Science Days
  await createCommentRating(prisma, {
    userId: users.regularUser2.id, // Daro
    eventId: events.kizunaRun.id,
    commentText:
      'Great event organization. As a volunteer, I enjoyed helping with the cultural setup.',
    rating: 4,
    status: CommentStatus.ACTIVE,
  });

  await createCommentRating(prisma, {
    userId: users.regularUser2.id, // Daro
    eventId: events.scienceDays.id,
    commentText:
      'Very informative STEM workshops. The robotics lab was impressive!',
    rating: 5,
    status: CommentStatus.ACTIVE,
  });

  // Seang attended Tanabata, Science Days
  await createCommentRating(prisma, {
    userId: users.regularUser3.id, // Seang
    eventId: events.tanabataFestival.id,
    commentText:
      'Beautiful star festival! The wish tree tradition was very meaningful.',
    rating: 5,
    status: CommentStatus.ACTIVE,
  });

  await createCommentRating(prisma, {
    userId: users.regularUser3.id, // Seang
    eventId: events.scienceDays.id,
    commentText:
      'The content was excellent but the venue could be larger for more participants.',
    rating: 4,
    status: CommentStatus.ACTIVE,
  });

  // Meng Hour attended Tena Concert
  await createCommentRating(prisma, {
    userId: users.regularUser4.id, // Meng Hour
    eventId: events.tenaConcert.id,
    commentText:
      "Fantastic concert! Tena's performance was incredible. Worth the venue change!",
    rating: 5,
    status: CommentStatus.ACTIVE,
  });

  // Ratanak attended Tanabata, Tena Concert
  await createCommentRating(prisma, {
    userId: users.regularUser5.id, // Ratanak
    eventId: events.tanabataFestival.id,
    commentText:
      'Peaceful and beautiful celebration. Learned a lot about Japanese culture.',
    rating: 4,
    status: CommentStatus.ACTIVE,
  });

  // Example of a deleted comment
  await createCommentRating(prisma, {
    userId: users.regularUser6.id, // Wathrak
    eventId: events.peaceMarch.id,
    commentText: 'This comment was inappropriate and has been removed.',
    rating: 1,
    status: CommentStatus.DELETED,
  });

  console.log('Comments and ratings seeded successfully');
  console.log('📊 Comments distribution across events completed');
}

async function createCommentRating(prisma: PrismaClient, data: any) {
  return prisma.commentRating.create({
    data: {
      user: { connect: { id: data.userId } },
      event: { connect: { id: data.eventId } },
      commentText: data.commentText,
      rating: data.rating,
      status: data.status || CommentStatus.ACTIVE,
    },
  });
}
