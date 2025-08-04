import { inject, Injectable } from '@angular/core';
import { Api } from './api';
import { Token } from '@angular/compiler';

@Injectable({
  providedIn: 'root',
})
export class Message {
  apiService = inject(Api);
  tokenService = inject(Token);
}
