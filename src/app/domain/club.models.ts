export type TeamRole = 'Coach' | 'Responsable d’équipe' | 'Assistant' | 'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant' | 'Joueur';

export interface ClubMember {
  id: string;
  name: string;
  role: TeamRole;
  active?: boolean;
  number?: number;
  bio?: string;
  photoDataUrl?: string;
  positions?: string[];
  /** @deprecated Kept while older locally cached rosters are migrated. */
  position?: string;
  sourceRole?: 'Joueur' | 'Joueur-coach';
  isCoach?: boolean;
  phone?: string;
  email?: string;
  sourceUrl?: string;
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

export interface StandingRow {
  teamId: string;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface ClubSnapshot {
  members: ClubMember[];
  fixtures: Fixture[];
  fixturesUpdatedAt: string;
  standings: StandingRow[];
  standingsUpdatedAt: string;
}

export interface SportsDataSnapshot {
  updatedAt: string;
  fixtures: Fixture[];
  standings: StandingRow[];
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
