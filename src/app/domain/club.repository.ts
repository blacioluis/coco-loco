import { ClubSnapshot, SportsDataSnapshot } from './club.models';

export abstract class ClubRepository {
  abstract getSnapshot(): ClubSnapshot;
  abstract loadSportsData(): Promise<SportsDataSnapshot | null>;
  abstract saveMembers(members: ClubSnapshot['members']): void;
}
