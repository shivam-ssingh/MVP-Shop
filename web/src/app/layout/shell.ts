import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { NotificationBell } from './notification-bell';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, MatButtonModule, MatIconModule, MatMenuModule, NotificationBell],
  template: `
    <header class="bar">
      <a class="brand" [routerLink]="auth.homeUrl()">Restock</a>

      <div class="actions">
        <app-notification-bell />

        <button mat-button class="me" [matMenuTriggerFor]="userMenu" [attr.aria-label]="'Account: ' + auth.user()?.name">
          <span class="initials" aria-hidden="true">{{ initials() }}</span>
        </button>
        <mat-menu #userMenu="matMenu" xPosition="before">
          <div class="who">
            <strong>{{ auth.user()?.name }}</strong>
            <span>{{ auth.user()?.role }}</span>
          </div>
          <button mat-menu-item (click)="auth.logout()">
            <mat-icon svgIcon="logout" />
            <span>Log out</span>
          </button>
        </mat-menu>
      </div>
    </header>

    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100%; }
    .bar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
      padding: 0 8px 0 16px;
      padding-top: env(safe-area-inset-top);
      background: var(--ink);
      color: #fff;
    }
    .brand {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 1.4rem;
      color: inherit;
      text-decoration: none;
    }
    .brand::after {
      /* A tiny shelf tag next to the name */
      content: '';
      display: inline-block;
      width: 10px;
      height: 14px;
      margin-left: 6px;
      background: var(--tag);
      border-radius: 2px;
      vertical-align: -1px;
    }
    .actions { display: flex; align-items: center; gap: 4px; }
    .me { min-width: 0; padding: 0 4px; color: inherit; }
    .initials {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgb(255 255 255 / 0.14);
      font-weight: 600;
      font-size: 0.85rem;
      letter-spacing: 0.02em;
      color: #fff;
    }
    .who {
      display: flex;
      flex-direction: column;
      padding: 8px 16px 12px;
      border-bottom: 1px solid var(--line);
      margin-bottom: 4px;
    }
    .who span { color: var(--muted); font-size: 0.85rem; }
    main { padding-bottom: env(safe-area-inset-bottom); }
  `,
})
export class Shell {
  protected auth = inject(AuthService);

  protected initials() {
    const name = this.auth.user()?.name ?? '';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
