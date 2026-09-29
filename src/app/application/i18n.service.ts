import { Injectable, computed, signal } from '@angular/core';
import { TeamRole } from '../domain/club.models';

export type Language = 'fr' | 'es';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly language = signal<Language>(localStorage.getItem('forestois-language') === 'es' ? 'es' : 'fr');
  readonly locale = computed(() => this.language() === 'es' ? 'es' : 'fr');

  t(fr: string, es: string): string {
    return this.language() === 'es' ? es : fr;
  }

  toggle(): void {
    this.language.update((language) => language === 'fr' ? 'es' : 'fr');
    localStorage.setItem('forestois-language', this.language());
    document.documentElement.lang = this.language();
  }

  role(role: TeamRole): string {
    const labels: Record<TeamRole, string> = {
      'Coach': 'Entrenador',
      'Responsable d’équipe': 'Responsable del equipo',
      'Assistant': 'Asistente',
      'Gardien': 'Portero',
      'Défenseur': 'Defensa',
      'Milieu': 'Centrocampista',
      'Attaquant': 'Delantero',
      'Joueur': 'Jugador',
    };
    return this.language() === 'es' ? labels[role] : role;
  }

  position(position: string): string {
    const labels: Record<string, string> = {
      'Ailier': 'Extremo',
      'Arrière latéral': 'Lateral',
      'Attaquant': 'Delantero',
      'Défenseur': 'Defensa',
      'Défenseur central': 'Defensa central',
      'Milieu': 'Centrocampista',
      'Milieu défensif': 'Centrocampista defensivo',
      'Milieu offensif': 'Centrocampista ofensivo',
    };
    return this.language() === 'es' ? labels[position] ?? position : position;
  }

  applyDocumentLanguage(): void {
    document.documentElement.lang = this.language();
  }
}
