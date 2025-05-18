import { PrismaClient, CommentStatus } from '@prisma/client';

export async function seedComments(
  prisma: PrismaClient,
  users: any,
  events: any,
) {
  console.log('Seeding comments and ratings...');

  await createCommentRating(prisma, {
    userId: users.regularUser1.id,
    eventId: events.charityRun.id,
    commentText:
      'This was a fantastic event! Well organized and for a great cause.',
    rating: 5,
    status: CommentStatus.ACTIVE,
  });

  await createCommentRating(prisma, {
    userId: users.regularUser2.id,
    eventId: events.charityRun.id,
    commentText:
      'Really enjoyed the run. Could use more water stations next time.',
    rating: 4,
    status: CommentStatus.ACTIVE,
  });

  await createCommentRating(prisma, {
    userId: users.regularUser1.id,
    eventId: events.techWorkshop.id,
    commentText: 'Very informative workshop. Learned a lot of new skills.',
    rating: 5,
    status: CommentStatus.ACTIVE,
  });

  await createCommentRating(prisma, {
    userId: users.regularUser3.id,
    eventId: events.techWorkshop.id,
    commentText: 'The content was good but the room was too small.',
    rating: 3,
    status: CommentStatus.ACTIVE,
  });

  await createCommentRating(prisma, {
    userId: users.regularUser2.id,
    eventId: events.environmentalCleanup.id,
    commentText:
      'Great community event! Made new friends while helping the environment.',
    rating: 5,
    status: CommentStatus.ACTIVE,
  });

  await createCommentRating(prisma, {
    userId: users.organizer.id,
    eventId: events.environmentalCleanup.id,
    commentText: 'This comment should be deleted due to inappropriate content.',
    rating: 1,
    status: CommentStatus.DELETED,
  });

  console.log('Comments and ratings seeded successfully');
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
