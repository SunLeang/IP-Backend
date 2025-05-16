import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Apply global middleware
  app.use(helmet());
  app.use(compression());
  app.enableCors();

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Static assets and frontend serving
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.use('/', express.static(join(__dirname, '..', 'public', 'index.html')));

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Volunteer Event Management API')
    .setDescription('API documentation for Volunteer Event Management system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3100);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();