import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfiguredSocketIoAdapter } from './socket-io.adapter';
import { PrismaExceptionFilter } from './prisma-exception.filter';
import { getConfiguredCorsOrigins, isAllowedCorsOrigin } from './cors-origins';
import * as helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const allowedOrigins = getConfiguredCorsOrigins(
    configService.get<string>('CORS_ORIGIN'),
  );

  app.use((helmet as any).default?.() || (helmet as any)({
    crossOriginResourcePolicy: false,
  }));
  app.enableCors({
    origin: (origin, callback) => {
      callback(null, isAllowedCorsOrigin(origin, allowedOrigins));
    },
    credentials: true,
  });
  app.useWebSocketAdapter(new ConfiguredSocketIoAdapter(app, configService));
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/files',
  });

  await app.listen(configService.get<number>('PORT') ?? 3000);
}
bootstrap();
