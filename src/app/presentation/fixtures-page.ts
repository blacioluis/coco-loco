import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ClubFacade } from '../application/club.facade';
import { I18nService } from '../application/i18n.service';
import { MatchDutiesService } from '../application/match-duties.service';
import { MatchDutyCardComponent } from './match-duty-card.component';
import { StandingsTableComponent } from './standings-table.component';
import { TeamAvatarComponent } from './team-avatar.component';

@Component({
  standalone: true,
  imports: [CommonModule, StandingsTableComponent, MatchDutyCardComponent, TeamAvatarComponent],
  templateUrl: './fixtures-page.html',
  styleUrl: './fixtures-page.scss',
})
export class FixturesPage {
  readonly club = inject(ClubFacade);
  readonly i18n = inject(I18nService);
  readonly duties = inject(MatchDutiesService);
  filter: 'all' | 'home' | 'away' = 'all';
  get filteredFixtures() {
    const fixtures = this.club.fixtures();
    return this.filter === 'all'
      ? fixtures
      : fixtures.filter((fixture) => fixture.home === (this.filter === 'home'));
  }
  get dutyHistory() {
    return [...this.duties.duties()]
      .sort((a, b) => b.fixtureDate.localeCompare(a.fixtureDate))
      .map((duty) => ({
        duty,
        opponent:
          this.club
            .fixtures()
            .find((fixture) => fixture.round === duty.round && fixture.date === duty.fixtureDate)
            ?.opponent ?? this.i18n.t('Match du club', 'Partido del club'),
      }));
  }
  dutyName(id: string, name: string) {
    return id === 'nasr-eddine-zabata' ? 'Nass' : name;
  }
  readonly encodeURIComponent = encodeURIComponent;
}
