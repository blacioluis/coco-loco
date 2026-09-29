import { Component, input } from '@angular/core';

@Component({
  selector: 'app-team-photo-header',
  standalone: true,
  template: `
    <header class="team-photo-header">
      <div class="team-photo-frame"><img src="assets/team-photo.jpg" [alt]="imageAlt()"></div>
      <div class="team-photo-caption">
        <div>
          <p class="eyebrow">{{ eyebrow() }}</p>
          <h1>{{ title() }} <em>{{ accent() }}</em></h1>
          <p>{{ description() }}</p>
        </div>
        @if (metricValue()) { <span><b>{{ metricValue() }}</b>{{ metricLabel() }}</span> }
      </div>
    </header>
  `,
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
