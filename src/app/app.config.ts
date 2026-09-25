import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeEs from '@angular/common/locales/es';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { ClubRepository } from './domain/club.repository';
import { BrowserClubRepository } from './infrastructure/browser-club.repository';

registerLocaleData(localeFr);
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    { provide: LOCALE_ID, useValue: 'fr-BE' },
    { provide: ClubRepository, useClass: BrowserClubRepository },
  ],
};
