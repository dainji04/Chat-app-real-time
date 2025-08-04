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
        canActivate: [authGuard], // Bảo vệ trang chính bằng AuthGuard
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./messages/messages').then((c) => c.Messages),
        canActivate: [authGuard], // Bảo vệ trang chính bằng AuthGuard
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then((c) => c.Profile),
        canActivate: [authGuard], // Bảo vệ trang chính bằng AuthGuard
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./settings/settings').then((c) => c.Settings),
        canActivate: [authGuard], // Bảo vệ trang chính bằng AuthGuard
      },
      {
        path: 'friends',
        loadComponent: () => import('./friends/friends').then((c) => c.Friends),
        canActivate: [authGuard], // Bảo vệ trang chính bằng AuthGuard
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayout,

    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login').then((c) => c.Login),
        canActivate: [guestGuard],
      },
      {
        path: 'sign-up',
        loadComponent: () =>
          import('./auth/signup/signup').then((c) => c.Signup),
        canActivate: [guestGuard],
      },
    ],
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password').then((c) => c.ResetPassword),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password').then((c) => c.ForgotPassword),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

export const routes: Routes = appRoutes;
