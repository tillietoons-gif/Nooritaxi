import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  'https://noori-backend-750921372930.asia-south1.run.app';

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

  public async connect(): Promise<void> {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected.');
      return;
    }

    const token = await SecureStore.getItemAsync('authToken');
    if (!token) {
      console.error('SocketService: No auth token found. Cannot connect.');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Socket disconnected by client.');
    }
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, listener);
    } else {
      console.warn(`Socket not connected. Cannot listen to event: ${event}`);
    }
  }

  public off(event: string, listener?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, listener);
    }
  }

  public emit(event: string, ...args: any[]): void {
    if (this.socket) {
      this.socket.emit(event, ...args);
    } else {
      console.warn(`Socket not connected. Cannot emit event: ${event}`);
    }
  }
}

export const socketService = SocketService.getInstance();
