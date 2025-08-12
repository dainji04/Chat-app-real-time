import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Token } from '../services/token/token';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export function baseUrlInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const token = inject(Token);

  let apiReq = req;
  let url = req.url;
  let Authorization = '';
  if (!req.url.startsWith('http')) {
    url = `${environment.apiBaseUrl}/${req.url}`;
  }

  // Thêm Authorization header nếu có token
  if (token && !token.isTokenExpired()) {
    Authorization = `Bearer ${token.getAccessToken()}`;
  }

  // Tạo request mới với base URL và Authorization header
  if (Authorization) {
    apiReq = req.clone({
      url: url,
      setHeaders: {
        Authorization: Authorization,
      },
      withCredentials: true, // send and receive cookies
    });
  } else {
    apiReq = req.clone({
      url: url,
      withCredentials: true, // send and receive cookies
    });
  }

  return next(apiReq);
}
