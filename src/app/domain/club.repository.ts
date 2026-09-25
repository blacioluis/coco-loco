import { ClubSnapshot } from './club.models';

export abstract class ClubRepository {
  abstract getSnapshot(): ClubSnapshot;
  abstract saveMembers(members: ClubSnapshot['members']): void;
}
