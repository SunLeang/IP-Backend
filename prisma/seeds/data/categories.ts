import { PrismaClient } from '@prisma/client';
import { MinioSeedUploader } from '../utils/minio-upload.util';
import { join } from 'path';

// ✅ Define the upload result type
interface UploadResult {
  originalUrl: string;
  thumbnailUrl: string;
  filename: string;
}

export async function seedCategories(prisma: PrismaClient) {
  console.log('Seeding categories with MinIO images...');

  const uploader = new MinioSeedUploader();
  await uploader.ensureBucketsExist();

  const categoriesData = [
    { name: 'Entertainment', imageName: 'entertainment.jpg', key: 'entertainment' },
    { name: 'Education', imageName: 'education.jpg', key: 'education' },
    { name: 'Traditional', imageName: 'traditional.jpg', key: 'traditional' },
    { name: 'Environment', imageName: 'environment.jpg', key: 'environment' },
  ];

  const categories = {};

  for (const categoryData of categoriesData) {
    try {
      // ✅ Explicitly type the uploadResult variable
      let uploadResult: UploadResult | null = null;

      // Try to upload image to MinIO
      try {
        const imagePath = join(
          __dirname,
          '../assets/images/categories',
          categoryData.imageName,
        );
        uploadResult = await uploader.uploadImageFromFile(
          imagePath,
          'categories',
          categoryData.imageName,
        );
      } catch (imageError) {
        console.log(
          `⚠️ Image upload failed for ${categoryData.name}, using default`,
        );
      }

      // Create category with MinIO image URL or default
      const category = await createCategory(
        prisma,
        categoryData.name,
        uploadResult?.thumbnailUrl || 'default-category.jpg',
      );

      // Use the predefined key
      categories[categoryData.key] = category;

      console.log(
        `✅ Category "${categoryData.name}" created with image: ${
          uploadResult?.thumbnailUrl || 'default-category.jpg'
        }`,
      );
    } catch (error) {
      console.error(
        `❌ Error creating category "${categoryData.name}":`,
        error.message,
      );
    }
  }

  console.log('Categories seeded successfully');
  console.log('✅ Available categories:', Object.keys(categories));
  return categories;
}

async function createCategory(
  prisma: PrismaClient,
  name: string,
  image?: string,
) {
  return prisma.eventCategory.upsert({
    where: { name },
    update: { image },
    create: { name, image },
  });
}
