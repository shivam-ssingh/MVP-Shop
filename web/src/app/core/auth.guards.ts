import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

/** Must be logged in. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() || inject(Router).parseUrl('/login');
};

/** Must have this role; otherwise go to your own home page. */
export const roleGuard =
  (role: Role): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    return auth.user()?.role === role || inject(Router).parseUrl(auth.homeUrl());
  };

/** The login page is only for people who aren't logged in. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.isLoggedIn() || inject(Router).parseUrl(auth.homeUrl());
};
