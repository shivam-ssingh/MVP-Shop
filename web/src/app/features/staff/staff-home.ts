import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { OrderRequestSummary } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { TimeAgoPipe } from '../../core/time-ago.pipe';
import { StatusPill } from '../../shared/status-pill';

@Component({
  selector: 'app-staff-home',
  imports: [RouterLink, MatIconModule, StatusPill, TimeAgoPipe],
  template: `
    <div class="page">
      <h1>What are you checking, {{ firstName() }}?</h1>

      <nav class="tiles" aria-label="Categories">
        @for (c of categories(); track c.id) {
          <a class="tile" [routerLink]="['/staff/new', c.id]">
            <mat-icon [svgIcon]="c.icon" />
            <span class="name">{{ c.name }}</span>
            <span class="count">
              {{ c.productCount ? c.productCount + ' products' : 'Type product names' }}
            </span>
          </a>
        } @empty {
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <span class="tile skeleton" aria-hidden="true"></span>
          }
        }
      </nav>

      <h2>Your requests</h2>
      @if (requests(); as list) {
        @if (list.length) {
          <ul class="requests">
            @for (r of list; track r.id) {
              <li>
                <a [routerLink]="['/requests', r.id]">
                  <mat-icon [svgIcon]="r.categoryIcon" />
                  <span class="what">
                    <strong>{{ r.categoryName }}</strong>
                    <span>{{ r.itemCount }} {{ r.itemCount === 1 ? 'item' : 'items' }}, {{ r.createdAt | timeAgo }}</span>
                  </span>
                  <app-status-pill [status]="r.status" />
                </a>
              </li>
            }
          </ul>
        } @else {
          <p class="empty">Requests you send appear here, so you can see when the manager has seen them.</p>
        }
      }
    </div>
  `,
  styles: `
    .page { max-width: 640px; margin: 0 auto; padding: 20px 16px 40px; }
    h1 {
      margin: 4px 0 18px;
      font-family: var(--font-display);
      font-size: 1.75rem;
      line-height: 1.15;
    }
    h2 { margin: 32px 0 10px; font-family: var(--font-display); font-size: 1.25rem; }

    .tiles {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    @media (min-width: 560px) { .tiles { grid-template-columns: repeat(3, 1fr); } }

    .tile {
      position: relative;
      display: flex;
      flex-direction: column;
      min-height: 120px;
      padding: 14px 14px 0;
      background: #fff;
      border-radius: 10px 10px 4px 4px;
      color: var(--ink);
      text-decoration: none;
      overflow: hidden;
      box-shadow: 0 1px 2px rgb(22 38 58 / 0.1);
      transition: transform 120ms ease;
    }
    .tile:active { transform: scale(0.98); }
    .tile:focus-visible { outline: 3px solid var(--action); outline-offset: 2px; }
    .tile mat-icon { width: 30px; height: 30px; color: var(--action); }
    .name {
      margin-top: auto;
      padding-bottom: 6px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 1.2rem;
      line-height: 1.1;
    }
    /* The shelf edge along the bottom of each tile */
    .count {
      margin: 0 -14px;
      padding: 5px 14px;
      background: var(--tag);
      font-size: 0.8rem;
      font-weight: 600;
    }
    .skeleton { background: rgb(255 255 255 / 0.6); box-shadow: none; }

    .requests { list-style: none; margin: 0; padding: 0; background: #fff; border-radius: 10px; overflow: hidden; }
    .requests li + li { border-top: 1px solid var(--line); }
    .requests a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      color: inherit;
      text-decoration: none;
    }
    .requests a:focus-visible { outline: 3px solid var(--action); outline-offset: -3px; }
    .requests mat-icon { color: var(--muted); flex: none; }
    .what { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .what span { color: var(--muted); font-size: 0.9rem; }
    .empty { color: var(--muted); }
  `,
})
export class StaffHome {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  private notifications = inject(NotificationService);

  protected categories = toSignal(this.api.categories(), { initialValue: [] });
  protected requests = signal<OrderRequestSummary[] | undefined>(undefined);
  protected firstName = () => this.auth.user()?.name.split(' ')[0] ?? '';

  constructor() {
    // Load now, and reload when a notification arrives so the status pills stay current.
    effect(() => {
      this.notifications.arrivals();
      firstValueFrom(this.api.myRequests()).then(
        (list) => this.requests.set(list),
        () => this.requests.set(this.requests() ?? []),
      );
    });
  }
}
