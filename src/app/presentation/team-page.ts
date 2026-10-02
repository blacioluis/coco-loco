import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClubFacade } from '../application/club.facade';
import { I18nService } from '../application/i18n.service';
import { ClubMember } from '../domain/club.models';
import { TeamPhotoHeaderComponent } from './team-photo-header.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, TeamPhotoHeaderComponent],
  templateUrl: './team-page.html',
  styleUrl: './team-page.scss',
})
export class TeamPage {
  readonly club = inject(ClubFacade);
  readonly i18n = inject(I18nService);
  get sortedPlayers() {
    return [...this.club.players()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }
  initials(name: string) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
  memberPositions(member: ClubMember) {
    return member.positions?.length ? member.positions : member.position ? [member.position] : [];
  }
}
