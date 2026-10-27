import { Component, effect, inject, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AppNotification } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { TimeAgoPipe } from '../core/time-ago.pipe';

@Component({
  selector: 'app-notification-bell',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule, TimeAgoPipe],
  template: `
    <button
      mat-icon-button
      class="bell"
      [class.ringing]="ringing()"
      [matMenuTriggerFor]="menu"
      [attr.aria-label]="ariaLabel()"
    >
      <mat-icon
        [svgIcon]="notifications.unreadCount() ? 'notifications_active' : 'notifications'"
        [matBadge]="badge()"
        [matBadgeHidden]="!notifications.unreadCount()"
        matBadgeSize="medium"
        aria-hidden="false"
      />
    </button>

    <mat-menu #menu="matMenu" xPosition="before" class="notification-menu">
      <div class="head" (click)="$event.stopPropagation()">
        <span class="title">Notifications</span>
        @if (notifications.unreadCount()) {
          <button mat-button class="mark-all" (click)="notifications.markAllRead()">Mark all as read</button>
        }
      </div>

      @for (n of notifications.items(); track n.id) {
        <button mat-menu-item class="item" [class.unread]="!n.isRead" (click)="open(n)">
          <span class="dot" aria-hidden="true"></span>
          <span class="text">
            <span class="message">{{ n.message }}</span>
            <span class="when">{{ n.createdAt | timeAgo }}</span>
          </span>
        </button>
      } @empty {
        <p class="empty">Nothing yet. You'll see updates about requests here.</p>
      }
    </mat-menu>
  `,
  styles: `
    .bell { color: inherit; }
    .ringing mat-icon { animation: ring 0.9s ease-in-out 2; transform-origin: 50% 10%; }
    @keyframes ring {
      0%, 100% { transform: rotate(0); }
      15% { transform: rotate(14deg); }
      30% { transform: rotate(-12deg); }
      45% { transform: rotate(8deg); }
      60% { transform: rotate(-5deg); }
      75% { transform: rotate(2deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .ringing mat-icon { animation: none; }
    }
  `,
})
export class NotificationBell {
  protected notifications = inject(NotificationService);
  private router = inject(Router);
  protected ringing = signal(false);

  constructor() {
    // Ring once when something new arrives while the app is open.
    effect(() => {
      if (this.notifications.arrivals() > 0) {
        this.ringing.set(false);
        requestAnimationFrame(() => this.ringing.set(true));
        setTimeout(() => this.ringing.set(false), 2000);
      }
    });
  }

  protected badge() {
    const n = this.notifications.unreadCount();
    return n > 9 ? '9+' : String(n);
  }

  protected ariaLabel() {
    const n = this.notifications.unreadCount();
    return n ? `Notifications, ${n} unread` : 'Notifications';
  }

  protected open(n: AppNotification) {
    this.notifications.markRead(n);
    this.router.navigate(['/requests', n.orderRequestId]);
  }
}
