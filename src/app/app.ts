import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CLUB_BRAND } from './brand.config';
import { I18nService } from './application/i18n.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly i18n = inject(I18nService);
  readonly brand = CLUB_BRAND;
  readonly mobileNavOpen = signal(false);
  readonly dark = signal(localStorage.getItem('forestois-theme') === 'dark');
  readonly logoVariant = signal<'selected' | 'alternate'>(
    localStorage.getItem('forestois-logo') === 'alternate' ? 'alternate' : 'selected',
  );
  readonly logoUrl = computed(() => this.brand.logos[this.logoVariant()]);

  constructor() {
    this.applyTheme();
    this.i18n.applyDocumentLanguage();
  }
  toggleTheme() {
    this.dark.update((value) => !value);
    this.applyTheme();
  }
  toggleMobileNav() {
    this.mobileNavOpen.update((value) => !value);
  }
  toggleLogo() {
    this.logoVariant.update((value) => (value === 'selected' ? 'alternate' : 'selected'));
    localStorage.setItem('forestois-logo', this.logoVariant());
  }
  private applyTheme() {
    const root = document.documentElement;
    const theme = this.dark() ? 'dark' : 'light';
    root.dataset['theme'] = theme;
    for (const [name, value] of Object.entries(this.brand.colors[theme]))
      root.style.setProperty(name, value);
    localStorage.setItem('forestois-theme', this.dark() ? 'dark' : 'light');
  }
}
