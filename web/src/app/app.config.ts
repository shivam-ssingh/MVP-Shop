import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { AuthService } from './core/auth.service';
import { ICONS } from './core/icons';
import { sessionExpiredInterceptor } from './core/session-expired.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([sessionExpiredInterceptor])),

    // Register the inline SVG icons so <mat-icon svgIcon="add"> works offline.
    provideAppInitializer(() => {
      const registry = inject(MatIconRegistry);
      const sanitizer = inject(DomSanitizer);
      for (const [name, svg] of Object.entries(ICONS)) {
        registry.addSvgIconLiteral(name, sanitizer.bypassSecurityTrustHtml(svg));
      }
    }),

    // Find out who is logged in (from the cookie) before the first route runs.
    provideAppInitializer(() => inject(AuthService).loadCurrentUser()),

    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
