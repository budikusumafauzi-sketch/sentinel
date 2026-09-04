import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 10485760, // 10MB max payload limit
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // API versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS
  await app.register((await import('@fastify/cors')).default as any, {
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true,
  });

  // Security headers
  await app.register((await import('@fastify/helmet')).default as any, {
    contentSecurityPolicy: false,
  });

  // Request body size limit
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRequest', (_req: any, _reply: any, done: () => void) => {
      done();
    });

  // OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('Sentinel API')
    .setDescription('Sentinel — Personal Cybersecurity Intelligence API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`Sentinel API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
