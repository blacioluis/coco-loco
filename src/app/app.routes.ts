import { Routes } from '@angular/router';
import { AdminPage, FixturesPage, HomePage, PlayerPage, TeamPage } from './presentation/club-pages';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Forestois SC 1 · Le club' },
  { path: 'equipe', component: TeamPage, title: 'L’équipe · Forestois SC 1' },
  { path: 'matchs', component: FixturesPage, title: 'Calendrier · Forestois SC 1' },
  { path: 'instagram', loadComponent: () => import('./presentation/instagram-page').then((module) => module.InstagramPage), title: 'Instagram · Forestois SC 1' },
  { path: 'joueurs/:id', component: PlayerPage, title: 'Profil · Forestois SC 1' },
  { path: 'admin', component: AdminPage, title: 'Espace club · Forestois SC 1' },
  { path: '**', redirectTo: '' }
];
