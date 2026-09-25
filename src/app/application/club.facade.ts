import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { ClubMember, Fixture, TeamRole } from '../domain/club.models';
import { ClubRepository } from '../domain/club.repository';

@Injectable({ providedIn: 'root' })
export class ClubFacade {
  private readonly repository = inject(ClubRepository);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snapshot = this.repository.getSnapshot();
  private readonly now = signal(Date.now());
  readonly members = signal(this.snapshot.members);
  readonly fixtures = signal([...this.snapshot.fixtures].sort((a, b) => fixtureStartTime(a) - fixtureStartTime(b)));
  readonly fixturesUpdatedAt = this.snapshot.fixturesUpdatedAt;
  readonly staff = computed(() => this.members().filter((member) => ['Coach', 'Responsable d’équipe', 'Assistant'].includes(member.role)));
  readonly players = computed(() => this.members().filter((member) => ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'].includes(member.role)));
  readonly nextFixture = computed(() => {
    const now = this.now();
    return this.fixtures().find((fixture) => fixture.status === 'scheduled' && fixtureEndTime(fixture) >= now);
  });

  constructor() {
    // Refresh the next-match card while a page stays open. A match remains current
    // until four hours after kick-off, as requested by the club.
    const interval = window.setInterval(() => this.now.set(Date.now()), 60_000);
    this.destroyRef.onDestroy(() => window.clearInterval(interval));
  }

  addMember(name: string, role: TeamRole, number?: number): void {
    const cleanName = name.trim();
    if (!cleanName) return;
    const member: ClubMember = { id: crypto.randomUUID(), name: cleanName, role, ...(number ? { number } : {}) };
    this.persist([...this.members(), member]);
  }

  removeMember(id: string): void {
    this.persist(this.members().filter((member) => member.id !== id));
  }

  private persist(members: ClubMember[]): void {
    this.repository.saveMembers(members);
    this.members.set(members);
  }
}

function fixtureEndTime(fixture: Fixture): number {
  const [year, month, day] = fixture.date.split('-').map(Number);
  const [hours, minutes] = fixture.time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes).getTime() + 4 * 60 * 60 * 1000;
}

function fixtureStartTime(fixture: Fixture): number {
  const [year, month, day] = fixture.date.split('-').map(Number);
  const [hours, minutes] = fixture.time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes).getTime();
}

export const TEAM_ROLES: TeamRole[] = ['Coach', 'Responsable d’équipe', 'Assistant', 'Gardien', 'Défenseur', 'Milieu', 'Attaquant'];
