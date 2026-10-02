import { Component, inject } from '@angular/core';
import { CLUB_BRAND } from '../brand.config';
import { I18nService } from '../application/i18n.service';
import { INSTAGRAM_POSTS, InstagramPostReference } from '../infrastructure/instagram-feed';
import { TeamPhotoHeaderComponent } from './team-photo-header.component';

@Component({
  standalone: true,
  imports: [TeamPhotoHeaderComponent],
  templateUrl: './instagram-page.html',
  styleUrl: './instagram-page.scss',
})
export class InstagramPage {
  readonly instagramUrl = CLUB_BRAND.instagramUrl;
  readonly i18n = inject(I18nService);
  readonly posts: InstagramPostReference[] = INSTAGRAM_POSTS;
}
