import { ClubMember, ClubSnapshot, SportsDataSnapshot } from './club.models';

export abstract class ClubRepository {
  abstract getSnapshot(): ClubSnapshot;
  abstract loadSportsData(): Promise<SportsDataSnapshot | null>;
  abstract loadMembers(): Promise<ClubMember[] | null>;
  abstract upsertMember(member: ClubMember, csrfToken: string): Promise<ClubMember | null>;
  abstract deleteMember(memberId: string, csrfToken: string): Promise<boolean>;
  abstract saveMembers(members: ClubSnapshot['members']): void;
}
