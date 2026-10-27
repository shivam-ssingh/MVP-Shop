import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, firstValueFrom, of, switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Product } from '../../core/models';
import { QtyTag } from '../../shared/qty-tag';

interface DraftItem {
  key: string;
  productId: number | null;
  name: string;
  size: string | null;
  qtyLeft: number | null;
  note: string | null;
  showNote: boolean;
}

type Option = { kind: 'product'; product: Product; added: boolean } | { kind: 'freeText'; name: string };

@Component({
  selector: 'app-request-builder',
  imports: [
    FormsModule,
    RouterLink,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    QtyTag,
  ],
  templateUrl: './request-builder.html',
  styleUrl: './request-builder.scss',
})
export class RequestBuilder {
  private api = inject(ApiService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  /** From the route: /staff/new/:categoryId */
  readonly categoryId = input.required<string>();
  private readonly catId = computed(() => Number(this.categoryId()));

  private readonly categories = toSignal(this.api.categories(), { initialValue: [] });
  protected readonly category = computed(() => this.categories().find((c) => c.id === this.catId()));

  protected readonly step = signal<'build' | 'review'>('build');
  protected readonly items = signal<DraftItem[]>([]);
  protected readonly note = signal('');
  protected readonly sending = signal(false);

  // ---- Search -------------------------------------------------------------
  protected readonly query = signal('');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('search');

  private readonly results = toSignal(
    toObservable(computed(() => ({ cat: this.catId(), q: this.query().trim() }))).pipe(
      debounceTime(150),
      distinctUntilChanged((a, b) => a.cat === b.cat && a.q === b.q),
      switchMap(({ cat, q }) => this.api.searchProducts(cat, q).pipe(catchError(() => of([] as Product[])))),
    ),
    { initialValue: [] as Product[] },
  );

  protected readonly options = computed<Option[]>(() => {
    const q = this.query().trim();
    const addedIds = new Set(this.items().map((i) => i.productId));
    const products: Option[] = this.results().map((p) => ({ kind: 'product', product: p, added: addedIds.has(p.id) }));
    const exact = this.results().some((p) => p.name.toLowerCase() === q.toLowerCase());
    return q && !exact ? [...products, { kind: 'freeText', name: q }] : products;
  });

  // ---- Totals and validation ---------------------------------------------
  protected readonly missingQty = computed(() => this.items().filter((i) => i.qtyLeft === null).length);
  protected readonly outCount = computed(() => this.items().filter((i) => i.qtyLeft === 0).length);
  protected readonly canReview = computed(() => this.items().length > 0 && this.missingQty() === 0);

  /** Which category's draft is currently loaded, so we never save one category's list under another. */
  private readonly loadedFor = signal<number | null>(null);

  constructor() {
    // Restore an unsent list for this category (e.g. after the phone locked or the page reloaded).
    effect(() => {
      const cat = this.catId();
      const saved = readDraft(cat);
      this.items.set(saved?.items ?? []);
      this.note.set(saved?.note ?? '');
      this.loadedFor.set(cat);
    });

    // Save the list on every change.
    effect(() => {
      const cat = this.loadedFor();
      const draft = { items: this.items(), note: this.note() };
      if (cat === this.catId()) writeDraft(cat, draft);
    });
  }

  protected optionLabel = (o: Option | null) => (o?.kind === 'product' ? o.product.name : (o?.name ?? ''));

  protected onSelected(event: MatAutocompleteSelectedEvent) {
    const option = event.option.value as Option;
    this.query.set('');
    const input = this.searchInput()?.nativeElement;
    if (input) input.value = '';

    let key: string;
    if (option.kind === 'product') {
      key = `p${option.product.id}`;
      if (!this.items().some((i) => i.key === key)) {
        const p = option.product;
        this.items.update((list) => [newItem(key, p.id, p.name, p.size), ...list]);
      }
    } else {
      key = `t${Date.now()}`;
      this.items.update((list) => [newItem(key, null, option.name, null), ...list]);
    }

    // Jump straight to the quantity for the item just added.
    setTimeout(() => document.getElementById(`qty-${key}`)?.focus(), 0);
  }

  protected setQty(item: DraftItem, value: string | number | null) {
    const n = value === '' || value === null ? null : Math.max(0, Math.min(9999, Math.floor(Number(value))));
    this.patch(item, { qtyLeft: Number.isNaN(n) ? null : n });
  }

  protected bump(item: DraftItem, delta: number) {
    this.patch(item, { qtyLeft: Math.max(0, (item.qtyLeft ?? 0) + delta) });
  }

  protected patch(item: DraftItem, changes: Partial<DraftItem>) {
    this.items.update((list) => list.map((i) => (i.key === item.key ? { ...i, ...changes } : i)));
  }

  protected remove(item: DraftItem) {
    this.items.update((list) => list.filter((i) => i.key !== item.key));
  }

  protected review() {
    this.step.set('review');
    window.scrollTo({ top: 0 });
  }

  protected async send() {
    this.sending.set(true);
    try {
      await firstValueFrom(
        this.api.submitRequest({
          categoryId: this.catId(),
          note: this.note().trim() || null,
          items: this.items().map((i) => ({
            productId: i.productId,
            freeTextName: i.productId === null ? i.name : null,
            qtyLeft: i.qtyLeft ?? 0,
            note: i.note?.trim() || null,
          })),
        }),
      );
      clearDraft(this.catId());
      this.items.set([]);
      this.snackBar.open("Request sent. You'll get a notification when it's seen.", undefined, { duration: 4000 });
      await this.router.navigateByUrl('/staff');
    } catch (err) {
      const msg =
        err instanceof HttpErrorResponse && err.status === 400
          ? 'Some items need fixing. Check each one has a name and quantity.'
          : "Couldn't send the request. Your list is saved on this phone, so try again in a moment.";
      this.snackBar.open(msg, 'OK', { duration: 6000 });
    } finally {
      this.sending.set(false);
    }
  }
}

function newItem(key: string, productId: number | null, name: string, size: string | null): DraftItem {
  return { key, productId, name, size, qtyLeft: null, note: null, showNote: false };
}

// ---- Draft storage (per phone, per category). Never required to work. -----
interface Draft {
  items: DraftItem[];
  note: string;
}
const draftKey = (categoryId: number) => `restock.draft.${categoryId}`;

function readDraft(categoryId: number): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(categoryId));
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeDraft(categoryId: number, draft: Draft) {
  try {
    if (draft.items.length || draft.note) localStorage.setItem(draftKey(categoryId), JSON.stringify(draft));
    else localStorage.removeItem(draftKey(categoryId));
  } catch {
    /* storage unavailable: the list just won't survive a reload */
  }
}

function clearDraft(categoryId: number) {
  try {
    localStorage.removeItem(draftKey(categoryId));
  } catch {
    /* ignore */
  }
}
