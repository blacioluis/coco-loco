export type TeamRole = 'Coach' | 'Responsable d’équipe' | 'Assistant' | 'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant';

export interface ClubMember {
  id: string;
  name: string;
  role: TeamRole;
  number?: number;
  bio?: string;
}

export interface Fixture {
  round: number;
  date: string;
  time: string;
  opponent: string;
  home: boolean;
  venue: string;
  address: string;
  venueCode: string;
  status: 'scheduled' | 'played';
  homeScore?: number;
  awayScore?: number;
}

export interface ClubSnapshot {
  members: ClubMember[];
  fixtures: Fixture[];
  fixturesUpdatedAt: string;
}

export type ClubEventType = 'Entraînement' | 'Match amical' | 'Réunion' | 'Activité club';

export interface ClubEvent {
  id: string;
  title: string;
  type: ClubEventType;
  date: string;
  time: string;
  location: string;
  description?: string;
}
