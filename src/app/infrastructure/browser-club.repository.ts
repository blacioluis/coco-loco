import { Injectable } from '@angular/core';
import { ClubSnapshot } from '../domain/club.models';
import { ClubRepository } from '../domain/club.repository';
import { FIXTURES_UPDATED_AT, INITIAL_FIXTURES } from './initial-fixtures';

const MEMBERS_KEY = 'forestois-sc-members-v1';

@Injectable()
export class BrowserClubRepository extends ClubRepository {
  getSnapshot(): ClubSnapshot {
    let members: ClubSnapshot['members'] = [];
    try { members = JSON.parse(localStorage.getItem(MEMBERS_KEY) ?? '[]'); } catch { members = []; }
    return { members, fixtures: INITIAL_FIXTURES, fixturesUpdatedAt: FIXTURES_UPDATED_AT };
  }

  saveMembers(members: ClubSnapshot['members']): void {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  }
}
