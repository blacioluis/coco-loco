export interface InstagramPostReference {
  id: string;
  type: 'publication' | 'reel';
  permalink: string;
  image: string;
}

// Sélection publique relevée le 25/09/2026. Le contenu de chaque carte est
// rendu directement par Instagram. Cette source pourra être remplacée par la
// réponse d'un endpoint serveur utilisant l'API Meta sans modifier la page.
export const INSTAGRAM_FEED_UPDATED_AT = '2026-09-25';

export const INSTAGRAM_POSTS: InstagramPostReference[] = [
  { id: 'CyG34H_o5kP', type: 'publication', permalink: 'https://www.instagram.com/p/CyG34H_o5kP/', image: 'assets/team-photo.jpg' },
  { id: 'CpYdIdKojMN', type: 'reel', permalink: 'https://www.instagram.com/reel/CpYdIdKojMN/', image: 'assets/football-detail.png' },
  { id: 'Ck39gXcLuBC', type: 'publication', permalink: 'https://www.instagram.com/p/Ck39gXcLuBC/', image: 'assets/hero-pitch.png' },
];
