import { PrismaClient } from '@prisma/client';

export async function seedCategories(prisma: PrismaClient) {
  console.log('Seeding categories...');

  const category1 = await createCategory(prisma, 'Charity', 'songkran.png');
  const category2 = await createCategory(prisma, 'Education', 'songkran.png');
  const category3 = await createCategory(prisma, 'Technology', 'songkran.png');
  const category4 = await createCategory(prisma, 'Environment', 'songkran.png');

  console.log('Categories seeded successfully');

  return {
    charity: category1,
    education: category2,
    technology: category3,
    environment: category4,
  };
}

async function createCategory(
  prisma: PrismaClient,
  name: string,
  image?: string,
) {
  return prisma.eventCategory.upsert({
    where: { name },
    update: {},
    create: {
      name,
      image,
    },
  });
}
