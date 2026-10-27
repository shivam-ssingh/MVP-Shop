import { Component, computed, inject, input } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { RequestStatus } from '../core/models';

@Component({
  selector: 'app-status-pill',
  template: `<span class="pill" [attr.data-status]="status()">{{ label() }}</span>`,
  styles: `
    .pill {
      display: inline-block;
      padding: 0.15rem 0.6rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }
    [data-status='Submitted'] { background: var(--tag); color: var(--ink); }
    [data-status='Seen'] { background: var(--action-soft); color: var(--action); }
    [data-status='Ordered'] { background: var(--ok-soft); color: var(--ok); }
  `,
})
export class StatusPill {
  private auth = inject(AuthService);
  readonly status = input.required<RequestStatus>();

  // A submitted request is "New" to the manager and "Sent" to the staff member who sent it.
  protected readonly label = computed(() => {
    const status = this.status();
    if (status === 'Submitted') return this.auth.isManager() ? 'New' : 'Sent';
    return status;
  });
}
