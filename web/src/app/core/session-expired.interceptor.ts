import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * If any API call (other than login / me) returns 401, the cookie has expired
 * or the demo database was reset: send the user back to the login page.
 */
export const sessionExpiredInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((err: unknown) => {
      const isAuthCall = req.url.startsWith('/api/auth/');
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthCall && auth.isLoggedIn()) {
        auth.clearSession();
      }
      return throwError(() => err);
    }),
  );
};
