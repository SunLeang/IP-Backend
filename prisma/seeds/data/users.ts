import { PrismaClient, SystemRole, CurrentRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MinioSeedUploader } from '../utils/minio-upload.util';
import { join } from 'path';

// ✅ Define the upload result type
interface UploadResult {
  originalUrl: string;
  thumbnailUrl: string;
  filename: string;
}

export async function seedUsers(prisma: PrismaClient) {
  console.log('Seeding users with MinIO profile images...');

  const uploader = new MinioSeedUploader();
  await uploader.ensureBucketsExist();

  const usersData = [
    {
      email: 'admin@example.com',
      name: 'Admin User',
      role: SystemRole.ADMIN,
      username: 'adminuser',
      imageName: 'admin.jpg',
      key: 'admin',
    },
    {
      email: 'superadmin@example.com',
      name: 'Super Admin',
      role: SystemRole.SUPER_ADMIN,
      username: 'superadmin',
      imageName: 'admin.jpg',
      key: 'superAdmin',
    },
    {
      email: 'organizer@example.com',
      name: 'Event Organizer',
      role: SystemRole.ADMIN,
      username: 'organizer',
      imageName: 'organizer.jpg',
      key: 'organizer',
    },
    {
      email: 'regular.user.1@example.com',
      name: 'Regular User 1',
      role: SystemRole.USER,
      username: 'regular_user_1',
      imageName: 'user1.jpg',
      key: 'regularUser1',
    },
    {
      email: 'regular.user.2@example.com',
      name: 'Regular User 2',
      role: SystemRole.USER,
      username: 'regular_user_2',
      imageName: 'user2.jpg',
      key: 'regularUser2',
    },
    {
      email: 'regular.user.3@example.com',
      name: 'Regular User 3',
      role: SystemRole.USER,
      username: 'regular_user_3',
      imageName: 'user3.jpg',
      key: 'regularUser3',
    },
  ];

  const users = {};

  for (const userData of usersData) {
    try {
      // ✅ Explicitly type the uploadResult variable
      let uploadResult: UploadResult | null = null;

      // Try to upload profile image to MinIO
      try {
        const imagePath = join(
          __dirname,
          '../assets/images/profiles',
          userData.imageName,
        );
        uploadResult = await uploader.uploadImageFromFile(
          imagePath,
          'profiles',
          userData.imageName,
        );
      } catch (imageError) {
        console.log(
          `⚠️ Image upload failed for ${userData.name}, using default`,
        );
      }

      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          profileImage: uploadResult?.thumbnailUrl || 'default-profile.jpg',
        },
        create: {
          email: userData.email,
          password: await bcrypt.hash('Password123!', 10),
          fullName: userData.name,
          systemRole: userData.role,
          currentRole: CurrentRole.ATTENDEE,
          username: userData.username,
          gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
          age: 20 + Math.floor(Math.random() * 30),
          org:
            userData.role === SystemRole.USER
              ? 'Local Community'
              : 'Admin Organization',
          profileImage: uploadResult?.thumbnailUrl || 'default-profile.jpg',
        },
      });

      // Use the predefined key
      users[userData.key] = user;

      console.log(
        `✅ User "${userData.name}" created with profile image: ${uploadResult?.thumbnailUrl || 'default-profile.jpg'}`,
      );
    } catch (error) {
      console.error(
        `❌ Error creating user "${userData.name}":`,
        error.message,
      );
    }
  }

  console.log('Users seeded successfully');
  console.log('✅ Available users:', Object.keys(users));
  return users;
}
