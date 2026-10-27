import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { OrderRequestSummary, RequestStatus } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { TimeAgoPipe } from '../../core/time-ago.pipe';
import { StatusPill } from '../../shared/status-pill';

type Filter = 'All' | RequestStatus;

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatIconModule, MatButtonToggleModule, StatusPill, TimeAgoPipe],
  template: `
    <div class="page">
      <h1>
        @if (counts().Submitted) {
          {{ counts().Submitted }} new {{ counts().Submitted === 1 ? 'request' : 'requests' }}
        } @else {
          You're all caught up
        }
      </h1>
      <p class="sub">Hi {{ firstName() }}. Opening a request lets the staff member know you've seen it.</p>

      <mat-button-toggle-group
        class="filters"
        [value]="filter()"
        (change)="filter.set($event.value)"
        aria-label="Filter requests"
        hideSingleSelectionIndicator
      >
        @for (f of filters; track f.value) {
          <mat-button-toggle [value]="f.value">
            {{ f.label }} <span class="n">{{ f.value === 'All' ? requests().length : counts()[f.value] }}</span>
          </mat-button-toggle>
        }
      </mat-button-toggle-group>

      @if (loaded()) {
        @if (visible().length) {
          <ul class="list">
            @for (r of visible(); track r.id) {
              <li [class.new]="r.status === 'Submitted'">
                <a [routerLink]="['/requests', r.id]">
                  <mat-icon [svgIcon]="r.categoryIcon" />
                  <span class="what">
                    <strong>{{ r.categoryName }}</strong>
                    <span>{{ r.staffName }}, {{ r.itemCount }} {{ r.itemCount === 1 ? 'item' : 'items' }}</span>
                  </span>
                  <span class="when">{{ r.createdAt | timeAgo }}</span>
                  <app-status-pill [status]="r.status" />
                  <mat-icon svgIcon="chevron_right" class="chev" />
                </a>
              </li>
            }
          </ul>
        } @else {
          <p class="empty">
            @switch (filter()) {
              @case ('Submitted') { No new requests. Staff requests appear here as soon as they're sent. }
              @case ('Seen') { Nothing waiting to be ordered. }
              @case ('Ordered') { Nothing ordered yet. }
              @default { No requests yet. }
            }
          </p>
        }
      }
    </div>
  `,
  styles: `
    .page { max-width: 880px; margin: 0 auto; padding: 20px 16px 40px; }
    h1 { margin: 4px 0 4px; font-family: var(--font-display); font-size: 1.9rem; line-height: 1.1; }
    .sub { margin: 0 0 18px; color: var(--muted); }

    .filters { margin-bottom: 14px; max-width: 100%; overflow-x: auto; background: #fff; }
    .n { margin-left: 4px; color: var(--muted); font-variant-numeric: tabular-nums; }

    .list { list-style: none; margin: 0; padding: 0; background: #fff; border-radius: 10px; overflow: hidden; }
    .list li { border-left: 4px solid transparent; }
    .list li + li { border-top: 1px solid var(--line); }
    .list li.new { border-left-color: var(--tag); }
    .list li.new strong { font-weight: 700; }
    .list a {
      display: grid;
      grid-template-columns: auto 1fr auto auto auto;
      align-items: center;
      gap: 12px;
      padding: 12px 8px 12px 12px;
      color: inherit;
      text-decoration: none;
    }
    .list a:hover { background: var(--paper); }
    .list a:focus-visible { outline: 3px solid var(--action); outline-offset: -3px; }
    .list mat-icon { color: var(--muted); }
    .what { display: flex; flex-direction: column; min-width: 0; }
    .what strong { font-weight: 600; }
    .what span, .when { color: var(--muted); font-size: 0.9rem; }
    .when { white-space: nowrap; }
    .chev { width: 20px; height: 20px; }

    @media (max-width: 560px) {
      .list a { grid-template-columns: auto 1fr auto; row-gap: 2px; }
      .when { grid-column: 2; grid-row: 2; }
      app-status-pill { grid-column: 3; grid-row: 1; }
      .chev { display: none; }
    }
    .empty { color: var(--muted); padding: 24px 0; }
  `,
})
export class Dashboard {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);

  protected readonly filters: { value: Filter; label: string }[] = [
    { value: 'All', label: 'All' },
    { value: 'Submitted', label: 'New' },
    { value: 'Seen', label: 'Seen' },
    { value: 'Ordered', label: 'Ordered' },
  ];

  protected readonly filter = signal<Filter>('All');
  protected readonly requests = signal<OrderRequestSummary[]>([]);
  protected readonly loaded = signal(false);

  protected readonly counts = computed(() => {
    const c: Record<RequestStatus, number> = { Submitted: 0, Seen: 0, Ordered: 0 };
    for (const r of this.requests()) c[r.status]++;
    return c;
  });

  protected readonly visible = computed(() =>
    this.filter() === 'All' ? this.requests() : this.requests().filter((r) => r.status === this.filter()),
  );

  protected firstName = () => this.auth.user()?.name.split(' ')[0] ?? '';

  constructor() {
    // Load now, and again whenever a new notification arrives (e.g. a staff member just sent a request).
    effect(() => {
      this.notifications.arrivals();
      this.load();
    });
  }

  private async load() {
    try {
      this.requests.set(await firstValueFrom(this.api.allRequests()));
    } finally {
      this.loaded.set(true);
    }
  }
}
