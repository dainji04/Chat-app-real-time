import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);
  console.log(authService.isLoggedIn());

  if (authService.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  } else {
    return true;
  }
};
