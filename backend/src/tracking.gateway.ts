import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TrackingGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinTrip')
  handleJoinTrip(
    @MessageBody() tripId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`trip_${tripId}`);
    return { event: 'joined', data: tripId };
  }

  @SubscribeMessage('updateLocation')
  handleUpdateLocation(
    @MessageBody() data: { tripId: string; lat: number; lng: number },
  ) {
    this.server.to(`trip_${data.tripId}`).emit('locationUpdated', {
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date().toISOString(),
    });
  }
}
