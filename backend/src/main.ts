import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfiguredSocketIoAdapter } from './socket-io.adapter';
import { PrismaExceptionFilter } from './prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN')?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });
  app.useWebSocketAdapter(new ConfiguredSocketIoAdapter(app, configService));
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(configService.get<number>('PORT') ?? 3000);
}
bootstrap();
