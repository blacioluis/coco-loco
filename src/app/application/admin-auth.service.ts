import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  readonly authenticated = signal(false);
  readonly checking = signal(true);
  readonly csrfToken = signal('');

  constructor() { void this.restore(); }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password }),
      });
      const result = await response.json() as { authenticated?: boolean; csrfToken?: string };
      this.apply(result);
      return response.ok && this.authenticated();
    } catch {
      this.apply({});
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': this.csrfToken() },
        body: JSON.stringify({ action: 'logout' }),
      });
    } finally {
      this.apply({});
    }
  }

  private async restore(): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, { cache: 'no-store', headers: { Accept: 'application/json' } });
      this.apply(response.ok ? await response.json() : {});
    } catch {
      this.apply({});
    } finally {
      this.checking.set(false);
    }
  }

  private apply(result: { authenticated?: boolean; csrfToken?: string }): void {
    this.authenticated.set(result.authenticated === true);
    this.csrfToken.set(typeof result.csrfToken === 'string' ? result.csrfToken : '');
  }

  private get apiUrl(): string {
    return new URL('api/auth.php', document.baseURI).toString();
  }
}
