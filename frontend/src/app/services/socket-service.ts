import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { Token } from './token';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor(private token: Token) {
    this.socket = io('http://localhost:3000', {
      auth: {
        token: this.token.getAccessToken(),
      },
      withCredentials: true,
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to socket server', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from socket server');
    });
  }

  listen<T = any>(event: string): Observable<T> {
    return new Observable((subscriber) => {
      this.socket.on(event, (data: T) => {
        subscriber.next(data);
      });
    });
  }

  disconnect() {
    this.socket.disconnect();
  }

  connect() {
    // Socket.IO không tự reconnect sau khi disconnect thủ công → cần tạo lại
    this.socket.connect();
  }

  joinConversation(conversationId: string) {
    this.socket.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket.emit('leave_conversation', conversationId);
  }

  sendMessage(data: {
    conversationId: string;
    content: string;
    type?: string;
    media?: any;
    replyTo?: string;
  }) {
    this.socket.emit('send_message', data);
  }
}
