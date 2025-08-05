import { Injectable } from '@angular/core';
import { Api } from './api';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Message {
  constructor(private api: Api) {}

  // Get all messages
  getAllConversations(): Observable<any[]> {
    return this.api.get<any[]>('messages');
  }
}
