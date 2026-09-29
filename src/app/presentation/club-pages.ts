import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClubFacade, TEAM_ROLES } from '../application/club.facade';
import { I18nService } from '../application/i18n.service';
import { AdminAuthService } from '../application/admin-auth.service';
import { ClubEventsService } from '../application/club-events.service';
import { PlayerPhotoService } from '../application/player-photo.service';
import { ClubEventType, TeamRole } from '../domain/club.models';
import { TeamPhotoHeaderComponent } from './team-photo-header.component';
import { StandingsTableComponent } from './standings-table.component';

@Component({ standalone: true, imports: [CommonModule, RouterLink, StandingsTableComponent], template: `
<main class="home-page">
  <section class="hero-banner"><img class="hero-background" src="assets/hero-pitch.png" alt="Terrain de football à la lumière du soir"><div class="hero-overlay"></div><div class="hero-copy"><p>{{ i18n.t('PLUS QU’UN CLUB', 'MÁS QUE UN CLUB') }}</p><h1>FORESTOIS SC 1</h1><strong>{{ i18n.t('FOOTBALL · AMITIÉ · PASSION', 'FÚTBOL · AMISTAD · PASIÓN') }}</strong><span>D4C · {{ i18n.t('SAISON', 'TEMPORADA') }} 2026 / 2027</span></div><img class="hero-ball" src="assets/football-detail.png" alt="Illustration d’un ballon au bord du terrain"></section>
  <div class="home-content">
    <div class="feature-grid">
      @if (club.nextFixture(); as next) { <section class="featured-match"><div class="feature-header"><div><p class="eyebrow">{{ i18n.t('PROCHAIN MATCH', 'PRÓXIMO PARTIDO') }} <span class="round">{{ i18n.t('JOURNÉE', 'JORNADA') }} {{ next.round }}</span></p><h2>{{ i18n.t('Place au match.', 'Es hora de jugar.') }}</h2></div><div class="feature-date"><b>{{ next.date | date:'d':'':i18n.locale() }}</b><span>{{ next.date | date:'MMM':'':i18n.locale() }}</span><small>{{ next.time }}</small></div></div><div class="opponents"><div class="opponent"><span class="opponent-mark">{{ next.home ? 'SC' : next.opponent.slice(0, 2) }}</span><b>{{ next.home ? 'FORESTOIS SC 1' : next.opponent }}</b></div><div class="versus-mark">VS</div><div class="opponent home-opponent"><img src="assets/club-coco.png" alt=""><b>{{ next.home ? next.opponent : 'FORESTOIS SC 1' }}</b></div></div><div class="match-location"><span>⌖</span><div><b>{{ next.venue }}</b><small>{{ next.address }}</small></div><a [href]="'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(next.address)" target="_blank" rel="noreferrer">{{ i18n.t('Itinéraire', 'Cómo llegar') }} ↗</a></div></section> }
      @if (club.forestoisStanding(); as standing) { <aside class="standings-card"><img class="standings-crest" src="assets/club-coco.png" alt="Blason Forestois SC"><div class="standings-top"><p>ABSSA · DIVISION 4C</p><span>{{ i18n.t('APRÈS', 'TRAS') }} {{ standing.played }} {{ i18n.t('JOURNÉES', 'JORNADAS') }}</span></div><div class="rank-display"><strong>1<sup>{{ i18n.t('er', 'º') }}</sup></strong><div><small>{{ i18n.t('CLASSEMENT', 'CLASIFICACIÓN') }}</small><b>{{ standing.points }} points</b></div></div><div class="season-stats"><span><b>{{ standing.wins }}</b> {{ i18n.t('victoires', 'victorias') }}</span><span><b>{{ standing.draws }}</b> {{ i18n.t('nul', 'empates') }}</span><span><b>{{ standing.losses }}</b> {{ i18n.t('défaite', 'derrotas') }}</span></div><div class="goal-difference">{{ i18n.t('DIFFÉRENCE DE BUTS', 'DIFERENCIA DE GOLES') }} <b>+{{ standing.goalDifference }}</b></div></aside> }
    </div>
    <app-standings-table />
    <section class="club-cards-section"><div class="section-heading"><div><p class="eyebrow">{{ i18n.t('VIVRE LE CLUB', 'VIVIR EL CLUB') }}</p><h2>{{ i18n.t('Forestois, sur et en dehors du terrain.', 'Forestois, dentro y fuera del campo.') }}</h2></div><a class="source-link" href="https://www.calabssa.be/c/152_1_forestois_sc/" target="_blank" rel="noreferrer">{{ i18n.t('Voir CalABSSA', 'Ver CalABSSA') }} ↗</a></div><div class="visual-cards"><a routerLink="/equipe" class="visual-card"><img src="assets/team-photo.jpg" alt="Photo de l’équipe Forestois SC 1"><span class="visual-card-shade"></span><span class="visual-card-copy"><small>{{ i18n.t('LES VISAGES DU CLUB', 'LAS CARAS DEL CLUB') }}</small><b>{{ i18n.t('L’équipe', 'El equipo') }}</b><span>{{ i18n.t('Joueurs & encadrement', 'Jugadores y cuerpo técnico') }} <i>↗</i></span></span></a><a routerLink="/matchs" class="visual-card"><img src="assets/football-detail.png" alt="Illustration d’un ballon posé sur la pelouse"><span class="visual-card-shade"></span><span class="visual-card-copy"><small>{{ i18n.t('SAISON', 'TEMPORADA') }} 2026 / 2027</small><b>{{ i18n.t('Les matchs', 'Los partidos') }}</b><span>{{ i18n.t('Calendrier & terrains', 'Calendario y campos') }} <i>↗</i></span></span></a><a routerLink="/instagram" class="visual-card"><img src="assets/hero-pitch.png" alt="Illustration d’un terrain de football à la lumière du soir"><span class="visual-card-shade"></span><span class="visual-card-copy"><small>{{ i18n.t('LA VIE DE L’ÉQUIPE', 'LA VIDA DEL EQUIPO') }}</small><b>Instagram</b><span>{{ i18n.t('Photos & actualités', 'Fotos y noticias') }} <i>↗</i></span></span></a></div><p class="image-credit">{{ i18n.t('Photo du groupe et visuels d’illustration', 'Foto del equipo e imágenes ilustrativas') }}</p></section>
  </div>
</main>` })
export class HomePage {
  readonly club = inject(ClubFacade);
  readonly i18n = inject(I18nService);
  readonly encodeURIComponent = encodeURIComponent;
}

@Component({ standalone: true, imports: [CommonModule, StandingsTableComponent], template: `
<main class="page"><header class="section-hero match-hero"><img class="section-hero-bg" src="assets/hero-pitch.png" alt=""><div><p class="eyebrow">{{ i18n.t('SAISON', 'TEMPORADA') }} 2026 / 2027 · D4C</p><h1>{{ i18n.t('Le calendrier', 'El calendario') }} <em>{{ i18n.t('des matchs.', 'de partidos.') }}</em></h1><p class="lede">{{ i18n.t('Tous les rendez-vous de Forestois SC 1, avec l’heure et l’adresse du terrain.', 'Todos los partidos del Forestois SC 1, con la hora y la dirección del campo.') }}</p></div></header>
@if (club.nextFixture(); as next) { <section class="upcoming-match"><div class="upcoming-label"><span class="live-dot"></span> {{ i18n.t('MATCH À VENIR', 'PRÓXIMO PARTIDO') }} <b>{{ i18n.t('JOURNÉE', 'JORNADA') }} {{ next.round }}</b></div><div class="upcoming-main"><div><h2>{{ next.home ? 'FORESTOIS SC 1' : next.opponent }} <i>·</i> {{ next.home ? next.opponent : 'FORESTOIS SC 1' }}</h2><p>{{ next.date | date:'EEEE d MMMM yyyy':'':i18n.locale() }} · {{ i18n.t('Coup d’envoi à', 'Inicio a las') }} {{ next.time }}</p></div><span class="upcoming-date"><b>{{ next.date | date:'d':'':i18n.locale() }}</b><small>{{ next.date | date:'MMM':'':i18n.locale() }}</small></span></div><div class="upcoming-place"><span>⌖</span><div><b>{{ next.venue }}</b><small>{{ next.address }}</small></div><a [href]="'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(next.address)" target="_blank" rel="noreferrer">{{ i18n.t('Itinéraire', 'Cómo llegar') }} ↗</a></div></section> } @else { <section class="upcoming-match"><div class="upcoming-label">{{ i18n.t('CALENDRIER À METTRE À JOUR', 'CALENDARIO PENDIENTE DE ACTUALIZACIÓN') }}</div><p>{{ i18n.t('Aucun prochain match n’est actuellement publié.', 'No hay ningún próximo partido publicado.') }}</p></section> }
<section class="training-card"><div class="training-icon">↗</div><div><p class="eyebrow">{{ i18n.t('RENDEZ-VOUS HEBDOMADAIRE', 'CITA SEMANAL') }}</p><h2>{{ i18n.t('Entraînement chaque mardi', 'Entrenamiento cada martes') }}</h2><p>{{ i18n.t('Rendez-vous à', 'Encuentro a las') }} <b>19 h 45</b> · {{ i18n.t('début de l’entraînement à', 'inicio del entrenamiento a las') }} <b>20 h</b></p></div><div class="training-venue"><b>Complexe Sportif du Bempt</b><span>Av. de la 2ème Armée Britannique, 1190 Forest</span><a href="https://www.google.com/maps/search/?api=1&query=Complexe+Sportif+du+Bempt+Forest+Belgique" target="_blank" rel="noreferrer">{{ i18n.t('Voir le terrain', 'Ver el campo') }} ↗</a></div></section>
<section class="calendar-toolbar" aria-label="Filtres du calendrier"><div><strong>{{ filteredFixtures.length }}</strong><span>{{ i18n.t('matchs au calendrier', 'partidos en el calendario') }}</span></div><div class="calendar-filters"><button type="button" [class.selected]="filter === 'all'" (click)="filter = 'all'">{{ i18n.t('Tous', 'Todos') }}</button><button type="button" [class.selected]="filter === 'home'" (click)="filter = 'home'">{{ i18n.t('À domicile', 'En casa') }}</button><button type="button" [class.selected]="filter === 'away'" (click)="filter = 'away'">{{ i18n.t('À l’extérieur', 'Fuera') }}</button></div></section>
@if (filteredFixtures.length) { <div class="fixture-list">
@for (fixture of filteredFixtures; track fixture.round) { <article class="fixture-card"><div class="fixture-date"><b>{{ fixture.date | date:'d':'':i18n.locale() }}</b><span>{{ fixture.date | date:'MMM':'':i18n.locale() }}</span></div><div class="fixture-info"><div class="fixture-meta">{{ i18n.t('JOURNÉE', 'JORNADA') }} {{ fixture.round }} <span class="venue-tag">{{ fixture.home ? i18n.t('DOMICILE', 'EN CASA') : i18n.t('EXTÉRIEUR', 'FUERA') }}</span>@if (fixture.status === 'played') { <span class="result-tag">{{ i18n.t('TERMINÉ', 'FINALIZADO') }}</span> }</div><h2>{{ fixture.home ? 'FORESTOIS SC 1' : fixture.opponent }} <i>·</i> {{ fixture.home ? fixture.opponent : 'FORESTOIS SC 1' }}</h2><p>{{ fixture.venue }} · {{ fixture.address }}</p></div><div class="fixture-time">@if (fixture.status === 'played') { <strong class="fixture-score">{{ fixture.homeScore }}–{{ fixture.awayScore }}</strong><small>{{ fixture.time }}</small> } @else { {{ fixture.time }} }<a [href]="'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(fixture.address)" target="_blank" rel="noreferrer" [attr.aria-label]="i18n.t('Ouvrir l’itinéraire', 'Abrir la ruta')">↗</a></div></article> }
</div> } @else { <div class="calendar-empty">Aucun match dans cette sélection. Choisis « Tous » pour afficher le calendrier complet.</div> }
<app-standings-table />
<p class="source-note">{{ i18n.t('Données mises à jour le', 'Datos actualizados el') }} {{ club.fixturesUpdatedAt | date:'d MMMM yyyy':'':i18n.locale() }} {{ i18n.t('depuis', 'desde') }} <a href="https://www.calabssa.be/c/152_1_forestois_sc/" target="_blank" rel="noreferrer">CalABSSA ↗</a>. {{ i18n.t('Les dates, horaires et terrains peuvent évoluer.', 'Las fechas, horarios y campos pueden cambiar.') }}</p></main>` })
export class FixturesPage {
  readonly club = inject(ClubFacade);
  readonly i18n = inject(I18nService);
  filter: 'all' | 'home' | 'away' = 'all';
  get filteredFixtures() {
    const fixtures = this.club.fixtures();
    return this.filter === 'all' ? fixtures : fixtures.filter((fixture) => fixture.home === (this.filter === 'home'));
  }
  readonly encodeURIComponent = encodeURIComponent;
}

@Component({ standalone: true, imports: [CommonModule, RouterLink, TeamPhotoHeaderComponent], template: `
<main class="page"><app-team-photo-header eyebrow="FORESTOIS SC 1 · D4C" [title]="i18n.t('Le groupe', 'El grupo')" accent="Forestois." [description]="i18n.t('Le staff et les joueurs, au cœur du club.', 'El cuerpo técnico y los jugadores, en el corazón del club.')" [imageAlt]="i18n.t('Photo de l’équipe Forestois SC 1', 'Foto del equipo Forestois SC 1')" [metricValue]="club.players().length.toString()" [metricLabel]="i18n.t('joueurs', 'jugadores')" />
<section class="squad-section"><div class="squad-heading"><div><p class="eyebrow">{{ i18n.t('LE VESTIAIRE', 'EL VESTUARIO') }}</p><h2>{{ i18n.t('Une équipe. Tous les profils.', 'Un equipo. Todos los perfiles.') }}</h2><p>{{ i18n.t('Clique sur une fiche pour découvrir le profil du joueur.', 'Abre una ficha para descubrir el perfil del jugador.') }}</p></div><div class="squad-total"><strong>{{ club.players().length }}</strong><span>{{ i18n.t('joueurs', 'jugadores') }}</span></div></div>
<div class="player-grid">@for (person of sortedPlayers; track person.id) { <article class="player-card"><a class="player-card-main" [routerLink]="['/joueurs', person.id]">@if (person.photoDataUrl) { <img class="player-card-photo" [src]="person.photoDataUrl" [alt]="person.name"> } @else { <span class="player-card-monogram">{{ initials(person.name) }}</span> }@if (person.number) { <span class="shirt-number">{{ person.number }}</span> }<span class="player-card-copy">@if (person.isCoach) { <small class="coach-chip">{{ i18n.t('JOUEUR-COACH', 'JUGADOR-ENTRENADOR') }}</small> } @else { <small>FORESTOIS SC 1</small> }<b>{{ person.name }}</b><span>{{ person.position ? i18n.position(person.position) : i18n.t('Poste à confirmer', 'Posición por confirmar') }}</span></span></a><a class="profile-goto" [routerLink]="['/joueurs', person.id]" [attr.aria-label]="i18n.t('Voir le profil de ', 'Ver el perfil de ') + person.name"><span>{{ i18n.t('Voir le profil', 'Ver perfil') }}</span><b>→</b></a></article> }</div></section>
<section class="staff-band"><div><p class="eyebrow">{{ i18n.t('ENCADREMENT', 'CUERPO TÉCNICO') }}</p><h2>{{ i18n.t('Les joueurs-coachs', 'Los jugadores-entrenadores') }}</h2></div><div class="staff-band-list">@for (person of club.staff(); track person.id) { <a [routerLink]="['/joueurs', person.id]">@if (person.photoDataUrl) { <img class="member-avatar" [src]="person.photoDataUrl" alt=""> } @else { <span>{{ initials(person.name) }}</span> }<b>{{ person.name }}</b><i>↗</i></a> }</div></section></main>` })
export class TeamPage {
  readonly club = inject(ClubFacade);
  readonly i18n = inject(I18nService);
  get sortedPlayers() { return [...this.club.players()].sort((a, b) => a.name.localeCompare(b.name, 'fr')); }
  initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
}

@Component({ standalone: true, imports: [CommonModule, RouterLink], template: `
<main class="page"><a routerLink="/equipe" class="back-link">← {{ i18n.t('Retour à l’équipe', 'Volver al equipo') }}</a>@if (member; as person) { <header class="profile-head">@if (person.photoDataUrl) { <img class="profile-photo" [src]="person.photoDataUrl" [alt]="person.name"> } @else { <span class="profile-number">{{ person.number ?? 'SCF' }}</span> }<div><p class="eyebrow">{{ person.sourceRole === 'Joueur-coach' ? i18n.t('Joueur-coach', 'Jugador-entrenador') : i18n.role(person.role) }} · FORESTOIS SC 1</p><h1>{{ person.name }}</h1><p class="lede">{{ person.bio || i18n.t('Profil en cours de création.', 'Perfil en proceso de creación.') }}</p></div></header><div class="profile-details"><span>{{ i18n.t('POSTE', 'POSICIÓN') }}</span><b>{{ person.position ? i18n.position(person.position) : i18n.role(person.role) }}</b></div>@if (person.phone || person.email) { <div class="profile-contact">@if (person.phone) { <a [href]="'tel:' + person.phone.replaceAll(' ', '')"><small>{{ i18n.t('TÉLÉPHONE', 'TELÉFONO') }}</small><b>{{ person.phone }}</b></a> }@if (person.email) { <a [href]="'mailto:' + person.email"><small>E-MAIL</small><b>{{ person.email }}</b></a> }@if (person.sourceUrl) { <a [href]="person.sourceUrl" target="_blank" rel="noreferrer"><small>{{ i18n.t('SOURCE', 'FUENTE') }}</small><b>CalABSSA ↗</b></a> }</div> } } @else { <section class="empty-state"><span>SCF</span><h1>{{ i18n.t('Profil introuvable', 'Perfil no encontrado') }}</h1><p>{{ i18n.t('Ce membre a peut-être été retiré de l’effectif.', 'Es posible que este miembro haya sido retirado de la plantilla.') }}</p><a routerLink="/equipe" class="button">{{ i18n.t('Voir l’équipe', 'Ver el equipo') }}</a></section> }</main>` })
export class PlayerPage {
  private readonly route = inject(ActivatedRoute);
  private readonly club = inject(ClubFacade);
  readonly i18n = inject(I18nService);
  readonly member = this.club.members().find((member) => member.id === this.route.snapshot.paramMap.get('id'));
}

@Component({ standalone: true, imports: [CommonModule, FormsModule], template: `
<main class="page admin-page">
@if (!auth.authenticated()) {
  <section class="admin-login"><img src="assets/club-coco.png" alt="Blason Forestois SC"><p class="eyebrow">FORESTOIS SC 1</p><h1>{{ i18n.t('Espace club', 'Área del club') }}</h1><p>{{ i18n.t('Connectez-vous pour gérer l’équipe et ses événements.', 'Inicia sesión para gestionar el equipo y sus eventos.') }}</p><form (ngSubmit)="login()"><label>{{ i18n.t('Identifiant', 'Usuario') }}<input name="username" [(ngModel)]="username" autocomplete="username" required></label><label>{{ i18n.t('Mot de passe', 'Contraseña') }}<input name="password" [(ngModel)]="password" type="password" autocomplete="current-password" required></label>@if (loginError) { <span class="login-error">{{ i18n.t('Identifiants incorrects.', 'Credenciales incorrectas.') }}</span> }<button class="button" type="submit">{{ i18n.t('Se connecter', 'Iniciar sesión') }}</button></form><small>{{ i18n.t('Accès local de démonstration : ne pas utiliser pour des données sensibles.', 'Acceso local de demostración: no usar para datos sensibles.') }}</small></section>
} @else {
  <header class="admin-dashboard-head"><div><p class="eyebrow">{{ i18n.t('TABLEAU DE BORD', 'PANEL DE CONTROL') }}</p><h1>{{ i18n.t('Bonjour, Forestois.', 'Hola, Forestois.') }}</h1><p>{{ i18n.t('Gérez les événements et l’effectif depuis un seul endroit.', 'Gestiona los eventos y la plantilla desde un solo lugar.') }}</p></div><button class="secondary-button button" type="button" (click)="auth.logout()">{{ i18n.t('Se déconnecter', 'Cerrar sesión') }}</button></header>
  <section class="dashboard-stats"><article><span>{{ i18n.t('ÉVÉNEMENTS', 'EVENTOS') }}</span><b>{{ events.events().length }}</b><small>{{ i18n.t('créés par le club', 'creados por el club') }}</small></article><article><span>{{ i18n.t('EFFECTIF', 'PLANTILLA') }}</span><b>{{ club.members().length }}</b><small>{{ i18n.t('membres enregistrés', 'miembros registrados') }}</small></article><article><span>{{ i18n.t('MATCHS', 'PARTIDOS') }}</span><b>{{ club.fixtures().length }}</b><small>{{ i18n.t('au calendrier', 'en el calendario') }}</small></article></section>
  <section class="admin-panel"><div class="section-heading"><div><p class="eyebrow">{{ i18n.t('AGENDA DU CLUB', 'AGENDA DEL CLUB') }}</p><h2>{{ i18n.t('Créer un événement', 'Crear un evento') }}</h2></div></div><form (ngSubmit)="addEvent()" class="event-form"><label>{{ i18n.t('Titre', 'Título') }}<input name="eventTitle" [(ngModel)]="eventTitle" required></label><label>{{ i18n.t('Type', 'Tipo') }}<select name="eventType" [(ngModel)]="eventType">@for (type of eventTypes; track type) { <option [ngValue]="type">{{ eventTypeLabel(type) }}</option> }</select></label><label>{{ i18n.t('Date', 'Fecha') }}<input name="eventDate" [(ngModel)]="eventDate" type="date" required></label><label>{{ i18n.t('Heure', 'Hora') }}<input name="eventTime" [(ngModel)]="eventTime" type="time" required></label><label class="event-wide">{{ i18n.t('Lieu', 'Lugar') }}<input name="eventLocation" [(ngModel)]="eventLocation" required></label><label class="event-wide">{{ i18n.t('Description', 'Descripción') }}<textarea name="eventDescription" [(ngModel)]="eventDescription" rows="3"></textarea></label><button class="button" type="submit">{{ i18n.t('Publier l’événement', 'Publicar el evento') }} ＋</button></form></section>
  <section class="admin-panel"><div class="section-heading"><div><p class="eyebrow">{{ i18n.t('ÉVÉNEMENTS', 'EVENTOS') }}</p><h2>{{ i18n.t('Agenda à venir', 'Próxima agenda') }}</h2></div><span class="count-tag">{{ events.events().length }}</span></div>@if (events.events().length) { <div class="event-list">@for (event of events.events(); track event.id) { <article><time><b>{{ event.date | date:'d':'':i18n.locale() }}</b><span>{{ event.date | date:'MMM':'':i18n.locale() }}</span></time><div><small>{{ eventTypeLabel(event.type) }} · {{ event.time }}</small><h3>{{ event.title }}</h3><p>{{ event.location }}@if (event.description) { · {{ event.description }} }</p></div><button class="remove-button" type="button" (click)="events.remove(event.id)">{{ i18n.t('Supprimer', 'Eliminar') }}</button></article> }</div> } @else { <div class="empty-inline">{{ i18n.t('Aucun événement créé pour le moment.', 'No hay eventos creados por el momento.') }}</div> }</section>
  <section class="admin-panel"><div class="section-heading"><div><p class="eyebrow">{{ i18n.t('EFFECTIF', 'PLANTILLA') }}</p><h2>{{ i18n.t('Ajouter un membre', 'Añadir un miembro') }}</h2></div></div><form (ngSubmit)="add()" class="member-form"><label>{{ i18n.t('Nom complet', 'Nombre completo') }}<input name="name" [(ngModel)]="name" required></label><label>{{ i18n.t('Rôle', 'Rol') }}<select name="role" [(ngModel)]="role">@for (item of roles; track item) { <option [ngValue]="item">{{ i18n.role(item) }}</option> }</select></label><label>{{ i18n.t('Numéro', 'Número') }}<input name="number" [(ngModel)]="number" type="number" min="1" max="99"></label><label class="photo-field">{{ i18n.t('Photo', 'Foto') }}<input type="file" accept="image/jpeg,image/png,image/webp" (change)="selectNewPhoto($event)"><small>{{ i18n.t('Compression WebP automatique', 'Compresión WebP automática') }}</small></label>@if (newPhoto) { <img class="photo-preview" [src]="newPhoto" alt=""> }<button class="button" type="submit">{{ i18n.t('Ajouter', 'Añadir') }} ＋</button></form>@if (photoError) { <p class="photo-error">{{ photoError }}</p> }<div class="admin-members">@for (person of club.members(); track person.id) { <div class="admin-member"><div class="admin-member-identity">@if (person.photoDataUrl) { <img class="member-avatar" [src]="person.photoDataUrl" [alt]="person.name"> } @else { <span class="role-symbol">{{ person.name.slice(0, 1) }}</span> }<span><b>{{ person.name }}</b><small>{{ person.sourceRole === 'Joueur-coach' ? i18n.t('Joueur-coach', 'Jugador-entrenador') : i18n.role(person.role) }}{{ person.position ? ' · '+person.position : '' }}{{ person.number ? ' · #'+person.number : '' }}</small></span></div><div class="member-actions"><label class="photo-button">{{ person.photoDataUrl ? i18n.t('Remplacer', 'Cambiar') : i18n.t('Ajouter une photo', 'Añadir foto') }}<input type="file" accept="image/jpeg,image/png,image/webp" (change)="replacePhoto(person.id, $event)"></label>@if (person.photoDataUrl) { <button class="remove-button" type="button" (click)="club.updateMemberPhoto(person.id)">{{ i18n.t('Retirer la photo', 'Quitar foto') }}</button> }<button class="remove-button" type="button" (click)="remove(person.id)">{{ i18n.t('Supprimer', 'Eliminar') }}</button></div></div> }</div></section>
}
</main>` })
export class AdminPage {
  readonly club = inject(ClubFacade);
  readonly i18n = inject(I18nService);
  readonly auth = inject(AdminAuthService);
  readonly events = inject(ClubEventsService);
  private readonly playerPhoto = inject(PlayerPhotoService);
  readonly roles = TEAM_ROLES;
  readonly eventTypes: ClubEventType[] = ['Entraînement', 'Match amical', 'Réunion', 'Activité club'];
  username = '';
  password = '';
  loginError = false;
  name = '';
  role: TeamRole = 'Gardien';
  number: number | null = null;
  newPhoto = '';
  photoError = '';
  eventTitle = '';
  eventType: ClubEventType = 'Entraînement';
  eventDate = '';
  eventTime = '';
  eventLocation = 'Complexe Sportif du Bempt';
  eventDescription = '';
  login() { this.loginError = !this.auth.login(this.username.trim(), this.password); this.password = ''; }
  add() { if (!this.name.trim()) return; this.club.addMember(this.name, this.role, this.number ?? undefined, this.newPhoto || undefined); this.name = ''; this.number = null; this.newPhoto = ''; }
  remove(id: string) { this.club.removeMember(id); }
  async selectNewPhoto(event: Event) { this.newPhoto = await this.readPhoto(event); }
  async replacePhoto(id: string, event: Event) { const photo = await this.readPhoto(event); if (photo) this.club.updateMemberPhoto(id, photo); }
  private async readPhoto(event: Event): Promise<string> {
    this.photoError = '';
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return '';
    try { return await this.playerPhoto.compress(file); }
    catch { this.photoError = this.i18n.t('Photo invalide ou trop lourde (10 Mo maximum).', 'Foto no válida o demasiado grande (máximo 10 MB).'); return ''; }
    finally { input.value = ''; }
  }
  addEvent() {
    if (!this.eventTitle.trim() || !this.eventDate || !this.eventTime || !this.eventLocation.trim()) return;
    this.events.add({ title: this.eventTitle.trim(), type: this.eventType, date: this.eventDate, time: this.eventTime, location: this.eventLocation.trim(), ...(this.eventDescription.trim() ? { description: this.eventDescription.trim() } : {}) });
    this.eventTitle = ''; this.eventDescription = '';
  }
  eventTypeLabel(type: ClubEventType) {
    const labels: Record<ClubEventType, string> = { 'Entraînement': 'Entrenamiento', 'Match amical': 'Partido amistoso', 'Réunion': 'Reunión', 'Activité club': 'Actividad del club' };
    return this.i18n.language() === 'es' ? labels[type] : type;
  }
}
