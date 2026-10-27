import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <section class="intro">
      <h1>Restock</h1>
      <p>Tell the manager what's running low.</p>
      <div class="shelf" aria-hidden="true">
        <span style="--w: 34%"></span><span style="--w: 22%"></span><span style="--w: 28%"></span>
      </div>
    </section>

    <form class="card" (ngSubmit)="submit()" #form="ngForm">
      <h2>Log in</h2>

      <mat-form-field appearance="outline">
        <mat-label>Username</mat-label>
        <input matInput name="username" [(ngModel)]="username" required autocomplete="username"
               autocapitalize="none" autocorrect="off" spellcheck="false" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Password</mat-label>
        <input matInput name="password" type="password" [(ngModel)]="password" required
               autocomplete="current-password" />
      </mat-form-field>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <button mat-flat-button type="submit" [disabled]="busy() || form.invalid">
        @if (busy()) {
          <mat-spinner diameter="20" />
        } @else {
          Log in
        }
      </button>
    </form>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
      background: var(--paper);
    }
    .intro {
      background: var(--ink);
      color: #fff;
      padding: calc(48px + env(safe-area-inset-top)) 24px 72px;
    }
    h1 {
      margin: 0;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: clamp(3rem, 14vw, 4.5rem);
      line-height: 0.95;
    }
    .intro p { margin: 12px 0 0; font-size: 1.15rem; opacity: 0.85; }
    /* A simple shelf with a few tags on it */
    .shelf {
      display: flex;
      gap: 10px;
      margin-top: 32px;
      padding-bottom: 6px;
      border-bottom: 4px solid rgb(255 255 255 / 0.25);
    }
    .shelf span {
      width: var(--w);
      height: 18px;
      background: var(--tag);
      border-radius: 2px;
    }
    .shelf span:nth-child(2) { background: var(--out); }
    .card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: min(100% - 32px, 400px);
      margin: -40px auto 32px;
      padding: 24px 20px 20px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 2px rgb(22 38 58 / 0.12), 0 8px 24px rgb(22 38 58 / 0.08);
    }
    h2 { margin: 0 0 16px; font-family: var(--font-display); font-size: 1.5rem; }
    .error { margin: 0 0 12px; color: var(--out); font-weight: 500; }
    button[type='submit'] { height: 48px; font-size: 1rem; }
    mat-spinner { margin: 0 auto; }
  `,
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  protected username = '';
  protected password = '';
  protected busy = signal(false);
  protected error = signal('');

  protected async submit() {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.username, this.password);
      await this.router.navigateByUrl(this.auth.homeUrl());
    } catch (err) {
      const status = err instanceof HttpErrorResponse ? err.status : 0;
      this.error.set(
        status === 401
          ? 'Incorrect username or password.'
          : "Can't reach the server. Check your connection and try again.",
      );
    } finally {
      this.busy.set(false);
    }
  }
}
