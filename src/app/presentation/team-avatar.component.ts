import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-team-avatar',
  standalone: true,
  templateUrl: './team-avatar.component.html',
  styleUrl: './team-avatar.component.scss',
})
export class TeamAvatarComponent {
  @Input({ required: true }) name = '';
  @Input() own = false;
  @Input() compact = false;

  initials(name: string): string {
    const words = name
      .replace(/\([^)]*\)/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) return 'FC';
    return (
      words.length === 1
        ? words[0].slice(0, 2)
        : words
            .slice(0, 2)
            .map((word) => word[0])
            .join('')
    ).toUpperCase();
  }
}
