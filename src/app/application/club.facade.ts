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
  readonly activeMembers = computed(() => this.members().filter((member) => member.active !== false));
  readonly fixtures = signal([...this.snapshot.fixtures].sort((a, b) => fixtureStartTime(a) - fixtureStartTime(b)));
  readonly fixturesUpdatedAt = signal(this.snapshot.fixturesUpdatedAt);
  readonly standings = signal(this.snapshot.standings);
  readonly standingsUpdatedAt = signal(this.snapshot.standingsUpdatedAt);
  readonly forestoisStanding = computed(() => this.standings().find((row) => row.teamId === '152_1_forestois_sc'));
  readonly staff = computed(() => this.activeMembers().filter((member) => member.isCoach || ['Coach', 'Responsable d’équipe', 'Assistant'].includes(member.role)));
  readonly players = computed(() => this.activeMembers().filter((member) => ['Gardien', 'Défenseur', 'Milieu', 'Attaquant', 'Joueur'].includes(member.role)));
  readonly nextFixture = computed(() => {
    const now = this.now();
    return this.fixtures().find((fixture) => fixture.status === 'scheduled' && fixtureEndTime(fixture) >= now);
  });

  constructor() {
    // Refresh the next-match card while a page stays open. A match remains current
    // until four hours after kick-off, as requested by the club.
    const interval = window.setInterval(() => this.now.set(Date.now()), 60_000);
    this.destroyRef.onDestroy(() => window.clearInterval(interval));
    void this.refreshSportsData();
    void this.refreshMembers();
  }

  private async refreshSportsData(): Promise<void> {
    const data = await this.repository.loadSportsData();
    if (!data) return;
    this.fixtures.set([...data.fixtures].sort((a, b) => fixtureStartTime(a) - fixtureStartTime(b)));
    this.standings.set(data.standings);
    this.fixturesUpdatedAt.set(data.updatedAt);
    this.standingsUpdatedAt.set(data.updatedAt);
  }

  private async refreshMembers(): Promise<void> {
    const members = await this.repository.loadMembers();
    if (members) this.persist(members);
  }

  async addMember(name: string, role: TeamRole, positions: string[], csrfToken: string, number?: number, photoDataUrl?: string): Promise<boolean> {
    const cleanName = name.trim();
    if (!cleanName) return false;
    const member: ClubMember = { id: crypto.randomUUID(), name: cleanName, role, active: true, positions: normalizePositions(positions), ...(number ? { number } : {}), ...(photoDataUrl ? { photoDataUrl } : {}) };
    return this.saveMember(member, csrfToken);
  }

  async updateMemberPhoto(id: string, photoDataUrl: string | null, csrfToken: string): Promise<boolean> {
    const member = this.members().find((item) => item.id === id);
    if (!member) return false;
    const { photoDataUrl: _oldPhoto, ...withoutPhoto } = member;
    return this.saveMember(photoDataUrl ? { ...withoutPhoto, photoDataUrl } : withoutPhoto, csrfToken);
  }

  async updateMemberPositions(id: string, positions: string[], csrfToken: string): Promise<boolean> {
    const member = this.members().find((item) => item.id === id);
    return member ? this.saveMember({ ...member, positions: normalizePositions(positions) }, csrfToken) : false;
  }

  async updateMemberDetails(id: string, details: Pick<ClubMember, 'name' | 'role' | 'number'>, csrfToken: string): Promise<boolean> {
    const member = this.members().find((item) => item.id === id);
    if (!member || !details.name.trim()) return false;
    const { number: _oldNumber, ...withoutNumber } = member;
    return this.saveMember({ ...withoutNumber, name: details.name.trim(), role: details.role, ...(details.number ? { number: details.number } : {}) }, csrfToken);
  }

  async removeMember(id: string, csrfToken: string): Promise<boolean> {
    const removed = await this.repository.deleteMember(id, csrfToken);
    if (removed) this.persist(this.members().filter((member) => member.id !== id));
    return removed;
  }

  async setMemberActive(id: string, active: boolean, csrfToken: string): Promise<boolean> {
    const member = this.members().find((item) => item.id === id);
    return member ? this.saveMember({ ...member, active }, csrfToken) : false;
  }

  private async saveMember(member: ClubMember, csrfToken: string): Promise<boolean> {
    const saved = await this.repository.upsertMember(member, csrfToken);
    if (!saved) return false;
    const members = this.members();
    const index = members.findIndex((item) => item.id === saved.id);
    this.persist(index < 0 ? [...members, saved] : members.map((item) => item.id === saved.id ? saved : item));
    return true;
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

export const TEAM_ROLES: TeamRole[] = ['Coach', 'Responsable d’équipe', 'Assistant', 'Gardien', 'Défenseur', 'Milieu', 'Attaquant', 'Joueur'];

function normalizePositions(positions: string[]): string[] {
  return [...new Set(positions.map((item) => item.trim()).filter(Boolean))].slice(0, 6);
}
