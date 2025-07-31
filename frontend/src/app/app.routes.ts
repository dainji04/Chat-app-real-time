import { Routes } from '@angular/router';
import { Home } from './home/home';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { MainLayout } from './layouts/main-layout/main-layout';
import { authGuard } from './guards/auth-guard';
import { guestGuard } from './guards/guest-guard';

const appRoutes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        component: Home,
      },
    ],
    canActivate: [authGuard], // Bảo vệ trang chính bằng AuthGuard
  },
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login/login').then((c) => c.Login),
      },
      {
        path: 'sign-up',
        loadComponent: () => import('./signup/signup').then((c) => c.Signup),
      },
    ],
    canActivate: [guestGuard],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

export const routes: Routes = appRoutes;
