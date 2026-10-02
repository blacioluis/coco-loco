import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClubFacade } from '../application/club.facade';
import { I18nService } from '../application/i18n.service';
import { ClubMember } from '../domain/club.models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './player-page.html',
  styleUrl: './player-page.scss',
})
export class PlayerPage {
  private readonly route = inject(ActivatedRoute);
  private readonly club = inject(ClubFacade);
  readonly i18n = inject(I18nService);
  readonly member = this.club
    .activeMembers()
    .find((member) => member.id === this.route.snapshot.paramMap.get('id'));
  memberPositions(member: ClubMember) {
    return member.positions?.length ? member.positions : member.position ? [member.position] : [];
  }
}
