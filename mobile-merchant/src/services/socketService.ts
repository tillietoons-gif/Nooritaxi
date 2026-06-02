import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000/orders';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(token: string): void {
    if (this.socket && this.socket.connected) {
      console.log('SocketService: Already connected.');
      return;
    }

    this.disconnect();

    console.log('SocketService: Attempting to connect...');
    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log(`SocketService: Connected with socket ID: ${this.socket?.id}`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`SocketService: Disconnected. Reason: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('SocketService: Connection Error!', error.message);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      console.log('SocketService: Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public on(eventName: string, callback: (...args: any[]) => void): void {
    this.socket?.on(eventName, callback);
  }

  public off(eventName: string, callback: (...args: any[]) => void): void {
    this.socket?.off(eventName, callback);
  }

  public emit(eventName: string, ...args: any[]): void {
    this.socket?.emit(eventName, ...args);
  }
}

const socketService = SocketService.getInstance();
export default socketService;
