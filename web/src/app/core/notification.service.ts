import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { Subscription, firstValueFrom, fromEvent, merge, switchMap, timer } from 'rxjs';
import { AuthService } from './auth.service';
import { AppNotification, NotificationList } from './models';

const POLL_MS = 15_000;

/**
 * Polls /api/notifications every 15 seconds while someone is logged in,
 * and again whenever the tab or installed app comes back into focus.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  readonly items = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);

  /** Increments whenever a notification we haven't seen before arrives. Pages can react to it. */
  readonly arrivals = signal(0);

  private newestId = 0;
  private polling?: Subscription;

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.start();
      } else {
        this.stop();
      }
    });
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  async refresh(): Promise<void> {
    try {
      this.apply(await firstValueFrom(this.http.get<NotificationList>('/api/notifications')));
    } catch {
      // Network blip or logged out: keep showing what we had.
    }
  }

  async markRead(n: AppNotification): Promise<void> {
    if (n.isRead) return;
    this.items.update((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    this.unreadCount.update((c) => Math.max(0, c - 1));
    await firstValueFrom(this.http.post(`/api/notifications/${n.id}/read`, {}));
  }

  async markAllRead(): Promise<void> {
    this.items.update((list) => list.map((x) => ({ ...x, isRead: true })));
    this.unreadCount.set(0);
    await firstValueFrom(this.http.post('/api/notifications/read-all', {}));
  }

  private start(): void {
    if (this.polling) return;
    const focus = merge(fromEvent(window, 'focus'), fromEvent(document, 'visibilitychange'));
    this.polling = merge(timer(0, POLL_MS), focus)
      .pipe(switchMap(() => this.http.get<NotificationList>('/api/notifications')))
      .subscribe({ next: (list) => this.apply(list), error: () => this.restart() });
  }

  private restart(): void {
    this.stop();
    if (this.auth.isLoggedIn()) setTimeout(() => this.start(), POLL_MS);
  }

  private stop(): void {
    this.polling?.unsubscribe();
    this.polling = undefined;
    this.items.set([]);
    this.unreadCount.set(0);
    this.newestId = 0;
  }

  private apply(list: NotificationList): void {
    const newest = list.items[0]?.id ?? 0;
    // Skip the very first load so the bell doesn't "ring" on login.
    if (this.newestId !== 0 && newest > this.newestId) {
      this.arrivals.update((n) => n + 1);
    }
    this.newestId = Math.max(this.newestId, newest);
    this.items.set(list.items);
    this.unreadCount.set(list.unreadCount);
  }
}
