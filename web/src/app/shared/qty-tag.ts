import { Component, computed, input } from '@angular/core';

/**
 * The yellow shelf-edge tag that shows "quantity left".
 * Turns red with "Out" when the shelf is empty.
 */
@Component({
  selector: 'app-qty-tag',
  template: `
    <span class="tag" [class.out]="isOut()" [class.compact]="compact()">
      <span class="num">{{ value() ?? '–' }}</span>
      <span class="unit">{{ isOut() ? 'Out' : 'left' }}</span>
    </span>
  `,
  styles: `
    :host { display: inline-flex; }
    .tag {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 3.5rem;
      padding: 0.3rem 0.5rem 0.25rem;
      background: var(--tag);
      color: var(--ink);
      border-radius: 3px;
      /* The little notch that shelf tags clip onto */
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 70%, 4px 62%, 0 54%);
      line-height: 1;
    }
    .num {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 1.75rem;
      font-variant-numeric: tabular-nums;
    }
    .unit { font-size: 0.75rem; font-weight: 600; margin-top: 2px; }
    .out { background: var(--out); color: #fff; }
    .compact { min-width: 2.75rem; padding: 0.2rem 0.4rem; }
    .compact .num { font-size: 1.3rem; }
    .compact .unit { font-size: 0.7rem; }
  `,
})
export class QtyTag {
  readonly value = input<number | null>(null);
  readonly compact = input(false);
  protected readonly isOut = computed(() => this.value() === 0);
}
