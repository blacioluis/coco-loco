import { Injectable } from '@angular/core';
import { ClubMember, ClubSnapshot, SportsDataSnapshot } from '../domain/club.models';
import { ClubRepository } from '../domain/club.repository';
import { FIXTURES_UPDATED_AT, INITIAL_FIXTURES } from './initial-fixtures';
import { INITIAL_MEMBERS } from './initial-members';
import { INITIAL_STANDINGS, STANDINGS_UPDATED_AT } from './initial-standings';

const MEMBERS_KEY = 'forestois-sc-members-v4';

@Injectable()
export class BrowserClubRepository extends ClubRepository {
  getSnapshot(): ClubSnapshot {
    let members: ClubSnapshot['members'];
    try {
      const saved = localStorage.getItem(MEMBERS_KEY);
      if (saved) members = JSON.parse(saved);
      else {
        members = structuredClone(INITIAL_MEMBERS);
        localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
      }
    } catch { members = structuredClone(INITIAL_MEMBERS); }
    return { members: members.map(normalizeMember), fixtures: INITIAL_FIXTURES, fixturesUpdatedAt: FIXTURES_UPDATED_AT, standings: INITIAL_STANDINGS, standingsUpdatedAt: STANDINGS_UPDATED_AT };
  }

  async loadSportsData(): Promise<SportsDataSnapshot | null> {
    try {
      const url = new URL('data/calabssa.json', document.baseURI);
      const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) return null;
      const data = await response.json() as Partial<SportsDataSnapshot>;
      if (!isSportsData(data)) return null;
      return data;
    } catch {
      return null;
    }
  }

  async loadMembers(): Promise<ClubMember[] | null> {
    try {
      const url = new URL('api/members.php', document.baseURI);
      const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) return null;
      const data = await response.json() as { members?: unknown };
      if (!Array.isArray(data.members)) return null;
      return data.members.filter(isMember).map(normalizeMember);
    } catch {
      return null;
    }
  }

  async upsertMember(member: ClubMember, csrfToken: string): Promise<ClubMember | null> {
    try {
      const url = new URL('api/members.php', document.baseURI);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ action: 'upsert', member }),
      });
      if (!response.ok) return null;
      const data = await response.json() as { member?: unknown };
      return isMember(data.member) ? normalizeMember(data.member) : null;
    } catch {
      return null;
    }
  }

  async deleteMember(memberId: string, csrfToken: string): Promise<boolean> {
    try {
      const url = new URL('api/members.php', document.baseURI);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ action: 'delete', memberId }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  saveMembers(members: ClubSnapshot['members']): void {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  }
}

function isMember(value: unknown): value is ClubMember {
  if (!value || typeof value !== 'object') return false;
  const member = value as Partial<ClubMember>;
  return typeof member.id === 'string' && typeof member.name === 'string' && typeof member.role === 'string';
}

function normalizeMember(member: ClubMember): ClubMember {
  const positions = Array.isArray(member.positions)
    ? member.positions.filter((item): item is string => typeof item === 'string' && !!item.trim())
    : member.position ? [member.position] : [];
  const { position: _legacyPosition, ...rest } = member;
  return { ...rest, active: member.active !== false, positions: [...new Set(positions.map((item) => item.trim()))] };
}

function isSportsData(value: Partial<SportsDataSnapshot>): value is SportsDataSnapshot {
  return typeof value.updatedAt === 'string'
    && Array.isArray(value.fixtures)
    && value.fixtures.length >= 1
    && value.fixtures.every((fixture) => typeof fixture?.round === 'number' && typeof fixture?.date === 'string' && typeof fixture?.time === 'string')
    && Array.isArray(value.standings)
    && value.standings.length >= 1;
}
