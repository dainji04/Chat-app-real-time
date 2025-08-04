import { Injectable } from '@angular/core';
import { Api } from './api';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class User {
  constructor(private apiService: Api) {}

  updateProfile(data: any): Observable<any> {
    return this.apiService.put<any>('user/update-profile', data);
  }

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file, file.name);
    return this.apiService.post<any>('user/upload-avatar', formData);
  }

  searchByEmail(email: string) {
    return this.apiService.get<any>(`user/search?email=${email}`);
  }
}
