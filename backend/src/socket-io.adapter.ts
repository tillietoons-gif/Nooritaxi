import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import { ServerOptions } from 'socket.io';
import { getConfiguredCorsOrigins, isAllowedCorsOrigin } from './cors-origins';

export class ConfiguredSocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const allowedOrigins = getConfiguredCorsOrigins(
      this.configService.get<string>('CORS_ORIGIN'),
    );

    return super.createIOServer(port, {
      ...options,
      cors: {
        ...options?.cors,
        origin: (origin, callback) => {
          callback(null, isAllowedCorsOrigin(origin, allowedOrigins));
        },
        credentials: true,
      },
    });
  }
}
