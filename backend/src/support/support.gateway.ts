import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma.service';

interface AuthenticatedUser {
  id: string;
  role: 'RIDER' | 'SUPPORT';
}

@WebSocketGateway({
  namespace: 'support',
  cors: { origin: '*' },
})
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SupportGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    const user = client['user'] as AuthenticatedUser;
    this.logger.log(
      `Client connected: ${client.id} | UserID: ${user?.id ?? 'Unauthorized'}`,
    );
    if (!user) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinTicket')
  handleJoinTicket(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const room = `ticket-${data.ticketId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    client.emit('joinedTicket', { success: true, ticketId: data.ticketId });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { ticketId: string; content: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const user = client['user'] as AuthenticatedUser;
    const room = `ticket-${data.ticketId}`;

    const message = await this.prisma.supportMessage.create({
      data: {
        body: data.content,
        ticketId: data.ticketId,
        senderId: user.id,
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Message from ${user.id} in room ${room}: ${data.content}`);

    this.server.to(room).emit('newMessage', message);
  }
}
