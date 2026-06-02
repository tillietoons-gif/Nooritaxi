import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from './prisma.service';
import { WsJwtGuard } from './auth/ws-jwt.guard';

@WebSocketGateway()
export class TrackingGateway {
  constructor(private readonly prisma: PrismaService) {}

  @WebSocketServer()
  server: Server;

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinTrip')
  async handleJoinTrip(
    @MessageBody() tripId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.id;
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [{ customerId: userId }, { driverId: userId }],
      },
      select: { id: true },
    });

    if (!trip) {
      throw new WsException('Trip not found or not assigned to user');
    }

    client.join(`trip_${tripId}`);
    return { event: 'joined', data: tripId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @MessageBody() data: { tripId: string; lat: number; lng: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.id;
    const trip = await this.prisma.trip.findFirst({
      where: { id: data.tripId, driverId: userId },
      select: { id: true },
    });

    if (!trip) {
      throw new WsException(
        'Only the assigned driver can update this trip location',
      );
    }

    await this.prisma.driver.update({
      where: { userId },
      data: {
        currentLat: data.lat,
        currentLng: data.lng,
      },
    });

    this.server.to(`trip_${data.tripId}`).emit('locationUpdated', {
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date().toISOString(),
    });
    
    // Broadcast to admins
    this.server.to('adminTracking').emit('driverLocationUpdated', {
      driverId: userId,
      lat: data.lat,
      lng: data.lng,
    });

    return { event: 'locationUpdated', data: { tripId: data.tripId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinAdminTracking')
  handleJoinAdminTracking(@ConnectedSocket() client: Socket) {
    if (client.data.user?.role !== 'ADMIN' && client.data.user?.role !== 'SUPPORT') {
      throw new WsException('Unauthorized');
    }
    client.join('adminTracking');
    return { event: 'joinedAdmin', data: true };
  }
}
