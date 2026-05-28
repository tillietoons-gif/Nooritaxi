import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { PrismaService } from '../prisma.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const rawToken = client.handshake.auth?.token;

    if (!rawToken || typeof rawToken !== 'string') {
      throw new WsException('Missing authentication token');
    }

    const token = rawToken.startsWith('Bearer ')
      ? rawToken.slice('Bearer '.length)
      : rawToken;

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        phone: string;
        role: string;
      }>(token);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          phone: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      });

      if (!user) {
        throw new WsException('Invalid authentication token');
      }

      client.data.user = user;
      return true;
    } catch (error) {
      if (error instanceof WsException) throw error;
      throw new WsException('Invalid authentication token');
    }
  }
}
