import { Fixture } from '../domain/club.models';

const away = (round: number, date: string, time: string, opponent: string, venue: string, address: string, venueCode: string, result?: [number, number]): Fixture => ({ round, date, time, opponent, home: false, venue, address, venueCode, status: result ? 'played' : 'scheduled', ...(result ? { homeScore: result[0], awayScore: result[1] } : {}) });
const home = (round: number, date: string, time: string, opponent: string, result?: [number, number]): Fixture => ({ round, date, time, opponent, home: true, venue: 'Complexe Sportif du Bempt', address: 'Av. de la 2ème Armée Britannique, 1190 Forest', venueCode: 'F01', status: result ? 'played' : 'scheduled', ...(result ? { homeScore: result[0], awayScore: result[1] } : {}) });

// Snapshot of CalABSSA's structured calendar data. Keep this fallback in the
// application so the calendar remains available when the source is offline.
export const FIXTURES_UPDATED_AT = '2026-09-25';

export const INITIAL_FIXTURES: Fixture[] = [
  away(1, '2026-08-29', '14:00', 'ELAN EVERE RAC', 'Parc St. Vincent (Bon Pasteur)', 'Rue Stroobants 75, 1140 Evere', 'E08', [0, 2]),
  home(2, '2026-09-05', '14:00', 'DEAF BRUSSELS FC', [5, 1]),
  away(3, '2026-09-12', '15:30', 'WINCHESTER F.C.', 'Nom du terrain à confirmer', 'Rue de la Grande Lecke 3, 1320 Beauvechain', 'B14', [0, 3]),
  home(4, '2026-09-19', '14:00', 'CELTIC ROOSTERS (Eq. 2)', [2, 1]),
  away(5, '2026-09-26', '12:30', 'SNEAKY BABOONS', 'Terrain de la Ferme du Plagniau', 'Rue de la Ferme du Plagniau, 1331 Rosières', 'R02'),
  home(6, '2026-10-03', '14:00', 'ONI RFC'),
  away(7, '2026-10-10', '14:00', 'FC PHOENIX', 'Parc St. Vincent (Bon Pasteur)', 'Rue Stroobants 75, 1140 Evere', 'E08'),
  home(8, '2026-10-17', '14:00', 'INTERIM MILAN'),
  home(9, '2026-10-24', '14:00', 'BRUSSELS LTC (Eq. 4)'),
  away(10, '2026-10-31', '15:00', 'FAUBOURG-BRAINOISE', 'Stade Gaston Reiff', 'Boulevard de l’Europe, 1420 Braine-l’Alleud', 'B03'),
  home(11, '2026-11-07', '14:00', 'MACAPSULES (LES)'),
  away(12, '2026-11-14', '12:30', 'FRAUDES (LES)', 'Parc St. Vincent (Bon Pasteur)', 'Rue Stroobants 75, 1140 Evere', 'E08'),
  home(13, '2026-11-21', '14:00', 'L’EKIP'),
  home(14, '2026-11-28', '14:00', 'ELAN EVERE RAC'),
  away(15, '2026-12-05', '15:00', 'DEAF BRUSSELS FC', 'Terrain de Haren', 'Rue de la Paroisse, 1130 Haren', 'B05'),
  home(16, '2026-12-12', '14:00', 'WINCHESTER F.C.'),
  away(17, '2027-01-09', '14:00', 'CELTIC ROOSTERS (Eq. 2)', 'Stade Justin Peeters', 'Avenue du Centre Sportif 20, 1300 Wavre', 'W07'),
  home(18, '2027-01-16', '14:00', 'SNEAKY BABOONS'),
  away(19, '2027-01-23', '12:30', 'ONI RFC', 'Complexe Sportif Evere', 'Avenue des Anciens Combattants 300, 1140 Evere', 'E07'),
  home(20, '2027-01-30', '14:00', 'FC PHOENIX'),
  away(21, '2027-02-06', '13:00', 'INTERIM MILAN', 'Stade Gaston Reiff', 'Boulevard de l’Europe, 1420 Braine-l’Alleud', 'B03'),
  away(22, '2027-02-13', '14:00', 'BRUSSELS LTC (Eq. 4)', 'Stade Soyer', 'Avenue Soyer 4, 1310 La Hulpe', 'L09'),
  home(23, '2027-02-20', '14:00', 'FAUBOURG-BRAINOISE'),
  away(24, '2027-02-27', '14:00', 'MACAPSULES (LES)', 'Stade Justin Peeters', 'Avenue du Centre Sportif 20, 1300 Wavre', 'W07'),
  home(25, '2027-03-06', '14:00', 'FRAUDES (LES)'),
  away(26, '2027-03-13', '14:00', 'L’EKIP', 'Terrain de la rue Baron Dhanis', 'Rue Baron Dhanis, 1040 Etterbeek', 'E04')
];
