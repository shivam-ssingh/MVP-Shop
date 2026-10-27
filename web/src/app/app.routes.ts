import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth.guards';
import { AuthService } from './core/auth.service';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: () => {
      const auth = inject(AuthService);
      return auth.isLoggedIn() ? auth.homeUrl() : '/login';
    },
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Log in | Restock',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      {
        path: 'staff',
        canActivate: [roleGuard('Staff')],
        title: 'Restock',
        loadComponent: () => import('./features/staff/staff-home').then((m) => m.StaffHome),
      },
      {
        path: 'staff/new/:categoryId',
        canActivate: [roleGuard('Staff')],
        title: 'New request | Restock',
        loadComponent: () => import('./features/staff/request-builder').then((m) => m.RequestBuilder),
      },
      {
        path: 'manager',
        canActivate: [roleGuard('Manager')],
        title: 'Requests | Restock',
        loadComponent: () => import('./features/manager/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'requests/:id',
        title: 'Request | Restock',
        loadComponent: () => import('./features/request-detail/request-detail').then((m) => m.RequestDetail),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
