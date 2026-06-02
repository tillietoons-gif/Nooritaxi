import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/airport'
})
export class AirportGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    console.log('Airport Operations Gateway Initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Airport Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Airport Client disconnected: ${client.id}`);
  }

  emitQueueUpdated(airportId: string, queueData: any) {
    this.server.emit(`airport.${airportId}.queue.updated`, queueData);
  }

  emitDriverEnteredQueue(airportId: string, data: any) {
    this.server.emit(`airport.${airportId}.driver.entered`, data);
  }

  emitFlightUpdated(airportId: string, flightData: any) {
    this.server.emit(`airport.${airportId}.flight.updated`, flightData);
  }

  emitZoneCongestion(airportId: string, zoneData: any) {
    this.server.emit(`airport.${airportId}.zone.congestion`, zoneData);
  }
}
