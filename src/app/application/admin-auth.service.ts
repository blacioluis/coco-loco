import { Injectable, signal } from '@angular/core';

// Prototype only: credentials embedded in a frontend bundle are never secret.
export const ADMIN_USERNAME = 'forestois';
export const ADMIN_PASSWORD = 'CocoLoco2026!';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  readonly authenticated = signal(sessionStorage.getItem('forestois-admin') === 'authenticated');

  login(username: string, password: string): boolean {
    const valid = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
    if (valid) {
      sessionStorage.setItem('forestois-admin', 'authenticated');
      this.authenticated.set(true);
    }
    return valid;
  }

  logout(): void {
    sessionStorage.removeItem('forestois-admin');
    this.authenticated.set(false);
  }
}
