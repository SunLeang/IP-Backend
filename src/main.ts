// ===========================================================================>> Core Library
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// ===========================================================================>> Third Party Library
import * as express from 'express';
import { join } from 'path';
import helmet from 'helmet';
import * as compression from 'compression';
import { Request, Response } from 'express';

// ===========================================================================>> Custom Library
import { AppModule } from './app.module';

class AppInitializer {
  private readonly logger = new Logger(AppInitializer.name);
  private app: NestExpressApplication;

  private async initializeApplication() {
    this.app = await NestFactory.create<NestExpressApplication>(AppModule);

    this.configureMiddlewares();
    this.configureValidation();
    this.configureRoutes();
    this.configureAssets();
    this.configureSwagger();

    // Increase request timeout (in milliseconds, e.g., 5 minutes)
    this.app.use((req, res, next) => {
      res.setTimeout(5 * 60 * 1000); // Set the timeout to 5 minutes (300000ms)
      next();
    });
  }

  private configureMiddlewares() {
    // Apply global middleware
    this.app.use(helmet());
    this.app.use(compression());

    // Configure CORS
    this.app.enableCors({
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'Content-Type, Accept, Authorization',
    });

    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
  }

  private configureValidation() {
    // Global validation pipe
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
  }

  private configureRoutes() {
    // Global prefix for API routes
    this.app.setGlobalPrefix('api', {
      exclude: ['/'],
    });
  }

  private configureAssets() {
    const projectRoot = process.cwd(); // Gets the current working directory
    const publicPath = join(projectRoot, 'public');

    this.app.useStaticAssets(publicPath);

    const expressApp = this.app.getHttpAdapter().getInstance();
    expressApp.get('/', (req: Request, res: Response) => {
      res.sendFile(join(publicPath, 'index.html'));
    });
  }

  private configureSwagger() {
    // Setup Swagger
    const config = new DocumentBuilder()
      .setTitle('Volunteer Event Management API')
      .setDescription('API documentation for Volunteer Event Management system')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(this.app, config);
    SwaggerModule.setup('api/docs', this.app, document);
  }

  public async start(port: number) {
    try {
      await this.initializeApplication();
      await this.app.listen(port);

      this.logger.log(
        `\x1b[32mApplication is running on: \x1b[34mhttp://localhost:${port}\x1b[37m`,
      );
      this.logger.log(
        `\x1b[32mAPI Documentation available at: \x1b[34mhttp://localhost:${port}/api/docs\x1b[37m`,
      );
    } catch (error) {
      this.logger.error(
        `\x1b[31mError starting the server: ${error.message}\x1b[0m`,
      );
      process.exit(1);
    }
  }
}

const appInitializer = new AppInitializer();
appInitializer.start(Number(process.env.PORT) || 3100);
