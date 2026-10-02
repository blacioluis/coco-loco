import { Component, input } from '@angular/core';

@Component({
  selector: 'app-team-photo-header',
  standalone: true,
  templateUrl: './team-photo-header.component.html',
  styleUrl: './team-photo-header.component.scss',
})
export class TeamPhotoHeaderComponent {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly accent = input.required<string>();
  readonly description = input.required<string>();
  readonly imageAlt = input.required<string>();
  readonly metricValue = input('');
  readonly metricLabel = input('');
}
