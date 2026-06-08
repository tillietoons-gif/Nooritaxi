import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/occ',
})
export class OperationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    console.log('OCC Operations Gateway Initialized');
  }

  handleConnection(client: Socket) {
    // Ideally requires token verification here.
    console.log(`OCC Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`OCC Client disconnected: ${client.id}`);
  }

  // System-wide Event Emitters used by other modules to trigger OCC live updates

  emitDriverLocationUpdate(driverId: string, lat: number, lng: number) {
    this.server.emit('driver.location.updated', { driverId, lat, lng });
  }

  emitTripCreated(trip: any) {
    this.server.emit('trip.created', trip);
  }

  emitTripStatusChanged(tripId: string, status: string) {
    this.server.emit('trip.updated', { tripId, status });
  }

  emitSosTriggered(sosAlert: any) {
    this.server.emit('sos.triggered', sosAlert);
  }

  emitIncidentCreated(incident: any) {
    this.server.emit('incident.created', incident);
  }

  emitFraudAlert(alert: any) {
    this.server.emit('fraud.alert', alert);
  }
}
