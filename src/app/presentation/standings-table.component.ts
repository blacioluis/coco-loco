import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ClubFacade } from '../application/club.facade';
import { I18nService } from '../application/i18n.service';

@Component({
  selector: 'app-standings-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './standings-table.component.html',
  styleUrl: './standings-table.component.scss',
})
export class StandingsTableComponent {
  readonly club = inject(ClubFacade);
  readonly i18n = inject(I18nService);
}
