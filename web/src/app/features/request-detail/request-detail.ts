import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { OrderRequestDetail } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { TimeAgoPipe } from '../../core/time-ago.pipe';
import { QtyTag } from '../../shared/qty-tag';
import { StatusPill } from '../../shared/status-pill';

@Component({
  selector: 'app-request-detail',
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, QtyTag, StatusPill, TimeAgoPipe],
  templateUrl: './request-detail.html',
  styleUrl: './request-detail.scss',
})
export class RequestDetail {
  private api = inject(ApiService);
  private notifications = inject(NotificationService);
  private snackBar = inject(MatSnackBar);
  protected auth = inject(AuthService);

  /** From the route: /requests/:id */
  readonly id = input.required<string>();

  protected readonly request = signal<OrderRequestDetail | null>(null);
  protected readonly notFound = signal(false);
  protected readonly saving = signal(false);

  protected readonly outCount = computed(() => this.request()?.items.filter((i) => i.qtyLeft === 0).length ?? 0);

  /** The three stages, in order, with the time each one happened (if it has). */
  protected readonly stages = computed(() => {
    const r = this.request();
    if (!r) return [];
    return [
      { label: 'Sent', at: r.createdAt },
      { label: 'Seen by manager', at: r.seenAt },
      { label: 'Ordered', at: r.orderedAt },
    ];
  });

  constructor() {
    // Load when the id changes, and quietly reload when a notification arrives
    // (e.g. the manager just marked this request as ordered).
    effect(() => {
      this.notifications.arrivals();
      const id = Number(this.id());
      untracked(() => this.load(id));
    });
  }

  private async load(id: number) {
    if (this.request()?.id !== id) this.request.set(null);
    this.notFound.set(false);
    try {
      this.request.set(await firstValueFrom(this.api.request(id)));
      // Opening the request marks its notifications as read on the server; update the bell now.
      this.notifications.refresh();
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) this.notFound.set(true);
    }
  }

  protected async markOrdered() {
    const r = this.request();
    if (!r) return;
    this.saving.set(true);
    try {
      this.request.set(await firstValueFrom(this.api.setStatus(r.id, 'Ordered')));
      this.snackBar.open(`Marked as ordered. ${r.staffName.split(' ')[0]} has been notified.`, undefined, {
        duration: 4000,
      });
    } catch {
      this.snackBar.open("Couldn't update the request. Try again.", 'OK', { duration: 5000 });
    } finally {
      this.saving.set(false);
    }
  }
}
