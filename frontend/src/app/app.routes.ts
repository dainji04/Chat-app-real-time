import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { HomeComponent } from './home/home.component';

const appRoutes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
      },
    ],
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'sign-up',
        loadComponent: () =>
          import('./signup/signup.component').then((m) => m.SignupComponent),
      },
    ],
  },
];

export const routes: Routes = appRoutes;
