import { Injectable, signal } from '@angular/core';
import { ClubEvent } from '../domain/club.models';

const STORAGE_KEY = 'forestois-club-events-v1';

@Injectable({ providedIn: 'root' })
export class ClubEventsService {
  readonly events = signal<ClubEvent[]>(this.load());

  add(event: Omit<ClubEvent, 'id'>): void {
    this.persist([...this.events(), { ...event, id: crypto.randomUUID() }]);
  }

  remove(id: string): void {
    this.persist(this.events().filter((event) => event.id !== id));
  }

  private persist(events: ClubEvent[]): void {
    const ordered = [...events].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ordered));
    this.events.set(ordered);
  }

  private load(): ClubEvent[] {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }
}
