import { Injectable } from '@angular/core';
import { Api } from './api';
import { Token } from './token';
import { signUp } from '../types/auth';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  constructor(private apiService: Api, private tokenService: Token) {}

  signup(data: signUp): Observable<any> {
    return this.apiService.post('auth/signup', data).pipe(
      tap((response: any) => {
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        // Lưu token sau khi signup thành công
        if (response.accessToken) {
          this.tokenService.setAccessToken(response.accessToken);
        }
      })
    );
  }

  login(username: string, password: string): Observable<any> {
    return this.apiService.post('auth/login', { username, password }).pipe(
      tap((response: any) => {
        // Lưu token sau khi login thành công
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
        if (response.accessToken) {
          this.tokenService.setAccessToken(response.accessToken);
        }
      })
    );
  }

  logout(): Observable<any> {
    this.tokenService.clearTokens();
    return this.apiService.post('auth/logout', {});
  }

  refreshToken(): Observable<any> {
    try {
      return this.apiService.post('auth/refresh-token', {}).pipe(
        tap((response: any) => {
          // Cập nhật access token mới
          if (response.accessToken) {
            this.tokenService.setAccessToken(response.accessToken);
          }
        })
      );
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    // Check if user has a valid access token
    if (this.tokenService.hasToken() && !this.tokenService.isTokenExpired()) {
      return true;
    } else {
      this.refreshToken().subscribe({
        next: (response) => {
          if (response.accessToken) {
            this.tokenService.setAccessToken(response.accessToken);
          }
          console.log('Token refreshed successfully', response);
          return true;
        },
        error: () => {
          // Nếu refresh token không thành công, xóa token và trả về false
          this.logout();
          return false;
        },
      });
    }

    return false;
  }

  getToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }
}
