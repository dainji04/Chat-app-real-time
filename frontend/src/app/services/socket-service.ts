import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { Token } from './token';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;

  constructor(private token: Token) {
    this.initializeSocket();
  }

  private initializeSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io('http://localhost:3000', {
      auth: {
        token: this.token.getAccessToken(),
      },
      withCredentials: true,
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to socket server', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from socket server');
    });
  }

  // Phương thức để reconnect với token mới
  reconnectWithNewToken() {
    console.log('🔄 Reconnecting socket with new token...');

    // Disconnect hoàn toàn socket cũ
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Khởi tạo socket mới với token mới
    this.initializeSocket();
  }

  // Thêm method để force disconnect
  forceDisconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket force disconnected and cleaned');
    }
  }

  listen<T = any>(event: string): Observable<T> {
    return new Observable((subscriber) => {
      if (this.socket) {
        this.socket.on(event, (data: T) => {
          subscriber.next(data);
        });
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('Disconnected from socket server');
    }
  }

  connect() {
    if (this.socket) {
      this.socket.connect();
      console.log('Reconnected to socket server');
    }
  }

  joinConversation(conversationId: string) {
    console.log(`Joining conversation: ${conversationId}`);
    if (this.socket) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit('leave_conversation', conversationId);
      console.log(`Left conversation: ${conversationId}`);
    }
  }

  sendMessage(data: {
    conversationId: string;
    content: string;
    type?: string;
    media?: any;
    replyTo?: string;
  }) {
    if (this.socket) {
      this.socket.emit('send_message', data);
    }
  }
}
