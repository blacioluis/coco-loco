import { inject, Injectable, signal } from '@angular/core';
import { ClubEvent } from '../domain/club.models';
import { AdminAuthService } from './admin-auth.service';

@Injectable({ providedIn: 'root' })
export class ClubEventsService {
  private readonly auth = inject(AdminAuthService);
  readonly events = signal<ClubEvent[]>([]);

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return false;
      const result = (await response.json()) as { events?: ClubEvent[] };
      if (!Array.isArray(result.events)) return false;
      this.events.set(this.order(result.events));
      return true;
    } catch {
      return false;
    }
  }

  async add(event: Omit<ClubEvent, 'id'>): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ action: 'create', event }),
      });
      const result = (await response.json().catch(() => ({}))) as { event?: ClubEvent };
      if (!response.ok || !result.event) return false;
      this.events.set(this.order([...this.events(), result.event]));
      return true;
    } catch {
      return false;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (!response.ok) return false;
      this.events.set(this.events().filter((event) => event.id !== id));
      return true;
    } catch {
      return false;
    }
  }

  private order(events: ClubEvent[]) {
    return [...events].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }
  private get headers() {
    return { 'Content-Type': 'application/json', 'X-CSRF-Token': this.auth.csrfToken() };
  }
  private get apiUrl() {
    return new URL('api/events.php', document.baseURI).toString();
  }
}
