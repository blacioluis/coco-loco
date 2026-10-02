import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClubFacade } from '../application/club.facade';
import { I18nService } from '../application/i18n.service';
import { MatchDutiesService } from '../application/match-duties.service';
import { MatchDutyCardComponent } from './match-duty-card.component';
import { StandingsTableComponent } from './standings-table.component';
import { TeamAvatarComponent } from './team-avatar.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StandingsTableComponent,
    MatchDutyCardComponent,
    TeamAvatarComponent,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  readonly club = inject(ClubFacade);
  readonly i18n = inject(I18nService);
  readonly duties = inject(MatchDutiesService);
  readonly encodeURIComponent = encodeURIComponent;
}
