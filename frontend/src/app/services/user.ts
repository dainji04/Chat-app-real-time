import { Injectable } from '@angular/core';
import { Api } from './api';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class User {
  constructor(private apiService: Api) {}

  updateProfile(data: any): Observable<any> {
    return this.apiService.put<any>('user/update-profile', data);
  }
}
