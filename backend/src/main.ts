import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, Logger, ValidationError, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { PUBLIC_UPLOAD_DIR } from './uploads/uploads.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  // JSON bodies are small on this site; the service-request route also enforces the contract's 16 KB cap.
  app.useBodyParser('json', { limit: '32kb' });
  app.useBodyParser('urlencoded', { limit: '32kb', extended: false });

  app.setGlobalPrefix('api');
  app.set('trust proxy', 1);

  const origins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      // Return { message, errors: { field: firstMessage } } so forms can show inline errors
      exceptionFactory: (validationErrors: ValidationError[]) => {
        const errors: Record<string, string> = {};
        const walk = (list: ValidationError[], prefix = '') => {
          for (const e of list) {
            const key = prefix ? `${prefix}.${e.property}` : e.property;
            if (e.constraints) errors[key] = Object.values(e.constraints)[0];
            if (e.children?.length) walk(e.children, key);
          }
        };
        walk(validationErrors);
        const n = Object.keys(errors).length;
        return new BadRequestException({
          statusCode: 400,
          message: n === 1 ? 'Please correct 1 field.' : `Please correct ${n} fields.`,
          errors,
        });
      },
    }),
  );

  // Admin-uploaded images (services and page photos) are public at /uploads.
  app.useStaticAssets(PUBLIC_UPLOAD_DIR, { prefix: '/uploads/', maxAge: '7d' });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  Logger.log(`API ready on http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`Static uploads served from ${join(PUBLIC_UPLOAD_DIR)}`, 'Bootstrap');
}

bootstrap();
