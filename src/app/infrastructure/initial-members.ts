import { ClubMember } from '../domain/club.models';

// Import sélectif du fichier SportEasy fourni le 25/09/2026.
// Les coordonnées, dates de naissance et autres données privées ne sont pas publiées.
export const MEMBERS_UPDATED_AT = '2026-09-25';

export const INITIAL_MEMBERS: ClubMember[] = [
  {
    id: 'patrick-janssens',
    name: 'Patrick Janssens',
    role: 'Responsable d’équipe',
    bio: 'Responsable et contact officiel de Forestois SC 1.',
    phone: '0479 95 08 14',
    email: 'patj.scf@gmail.com',
    sourceUrl: 'https://www.calabssa.be/c/152_1_forestois_sc/',
  },
  member('ricardo-almeida', 'Ricardo Almeida', 'Défenseur', 4, 'Arrière latéral'),
  member('anthony-astudillo', 'Anthony Astudillo', 'Joueur', 12),
  member('luis-blacio', 'Luis Blacio', 'Défenseur', 2, 'Défenseur'),
  member('bryan-castillo', 'Bryan Castillo', 'Attaquant', 11, 'Attaquant'),
  member('marlon-cedeno', 'Marlon Cedeno', 'Milieu', 10, 'Milieu'),
  member('tito-jhovanny-cedeno-astudillo', 'Tito Jhovanny Cedeño Astudillo', 'Milieu', 15, 'Milieu offensif'),
  member('carlos-collaguazo', 'Carlos Collaguazo', 'Joueur'),
  member('tybo-croquefer', 'Tybo Croquefer', 'Joueur'),
  member('francisco-diaz', 'Francisco Diaz', 'Milieu', 10, 'Milieu offensif'),
  member('jordan-ekofo', 'Jordan Ekofo', 'Joueur'),
  member('salvatore-fiore', 'Salvatore Fiore', 'Milieu', 8, 'Milieu'),
  member('giuseppe-fiore', 'Giuseppe Fiore', 'Attaquant', undefined, 'Attaquant'),
  member('jarol-garcia', 'Jarol Garcia', 'Joueur'),
  member('fernando-gordillo', 'Fernando Gordillo', 'Joueur'),
  member('loic-le-pennec', 'Loic Le pennec', 'Joueur'),
  member('paul-maldonado', 'Paul Maldonado', 'Joueur'),
  member('samuel-mancera', 'Samuel Mancera', 'Attaquant', undefined, 'Attaquant'),
  member('bryan-mendoza', 'Bryan Mendoza', 'Joueur'),
  member('igor-mitrovic', 'Igor Mitrovic', 'Joueur'),
  member('javier-moya', 'Javier Moya', 'Défenseur', 8, 'Défenseur central'),
  member('xavier-moya-lopez', 'Xavier Moya Lopez', 'Milieu', 5, 'Milieu défensif'),
  member('cristian-nunez', 'Cristian Nunez', 'Défenseur', undefined, 'Arrière latéral'),
  member('biko-patoma', 'Biko Patoma', 'Joueur'),
  member('ismael-sanchez', 'Ismael Sanchez', 'Attaquant', 3, 'Attaquant', true),
  member('christian-suntaxi', 'Christian Suntaxi', 'Joueur'),
  member('henrry-trivino', 'Henrry Triviño', 'Joueur'),
  member('antoine-vandevreye', 'Antoine Vandevreye', 'Milieu', 24, 'Milieu'),
  member('joseph-villarroel', 'Joseph Villarroel', 'Attaquant', undefined, 'Ailier'),
  member('nasr-eddine-zabata', 'Nasr-Eddine Zabata', 'Joueur'),
];

function member(id: string, name: string, role: ClubMember['role'], number?: number, position?: string, isCoach = false): ClubMember {
  return {
    id,
    name,
    role,
    sourceRole: isCoach ? 'Joueur-coach' : 'Joueur',
    ...(number ? { number } : {}),
    ...(position ? { position } : {}),
    ...(isCoach ? { isCoach: true } : {}),
  };
}
