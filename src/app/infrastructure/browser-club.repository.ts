import { Injectable } from '@angular/core';
import { ClubSnapshot } from '../domain/club.models';
import { ClubRepository } from '../domain/club.repository';
import { FIXTURES_UPDATED_AT, INITIAL_FIXTURES } from './initial-fixtures';
import { INITIAL_MEMBERS } from './initial-members';
import { INITIAL_STANDINGS, STANDINGS_UPDATED_AT } from './initial-standings';

const MEMBERS_KEY = 'forestois-sc-members-v3';
const LEGACY_MEMBERS_KEYS = ['forestois-sc-members-v2', 'forestois-sc-members-v1'];

@Injectable()
export class BrowserClubRepository extends ClubRepository {
  getSnapshot(): ClubSnapshot {
    let members: ClubSnapshot['members'];
    try {
      const saved = localStorage.getItem(MEMBERS_KEY);
      if (saved) members = JSON.parse(saved);
      else {
        const previous = LEGACY_MEMBERS_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
        const legacy: ClubSnapshot['members'] = JSON.parse(previous ?? '[]');
        members = mergeImportedMembers(legacy);
        localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
      }
    } catch { members = structuredClone(INITIAL_MEMBERS); }
    return { members, fixtures: INITIAL_FIXTURES, fixturesUpdatedAt: FIXTURES_UPDATED_AT, standings: INITIAL_STANDINGS, standingsUpdatedAt: STANDINGS_UPDATED_AT };
  }

  saveMembers(members: ClubSnapshot['members']): void {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  }
}

function mergeImportedMembers(legacy: ClubSnapshot['members']): ClubSnapshot['members'] {
  const byName = new Map(legacy.map((member) => [member.name.trim().toLocaleLowerCase('fr'), member]));
  const imported = INITIAL_MEMBERS.map((member) => ({ ...member, ...byName.get(member.name.toLocaleLowerCase('fr')), id: member.id }));
  const importedNames = new Set(INITIAL_MEMBERS.map((member) => member.name.toLocaleLowerCase('fr')));
  return [...imported, ...legacy.filter((member) => !importedNames.has(member.name.trim().toLocaleLowerCase('fr')))];
}
