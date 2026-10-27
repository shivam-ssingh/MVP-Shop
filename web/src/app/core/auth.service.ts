import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isManager = computed(() => this._user()?.role === 'Manager');

  /** Where each role lands after logging in. */
  homeUrl(): string {
    return this.isManager() ? '/manager' : '/staff';
  }

  /** Called once at startup: is there still a valid login cookie? */
  async loadCurrentUser(): Promise<void> {
    try {
      this._user.set(await firstValueFrom(this.http.get<User>('/api/auth/me')));
    } catch {
      this._user.set(null);
    }
  }

  async login(username: string, password: string): Promise<void> {
    const user = await firstValueFrom(this.http.post<User>('/api/auth/login', { username, password }));
    this._user.set(user);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/auth/logout', {}));
    } finally {
      this.clearSession();
    }
  }

  /** Used when the server says the cookie is no longer valid. */
  clearSession(): void {
    this._user.set(null);
    this.router.navigateByUrl('/login');
  }
}
