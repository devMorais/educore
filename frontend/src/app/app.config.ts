import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  provideLucideIcons,
  LucidePresentation,
  LucideFileText,
  LucideFileCheck,
  LucideAccessibility,
  LucideSparkles,
} from '@lucide/angular';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideLucideIcons(
      LucidePresentation,
      LucideFileText,
      LucideFileCheck,
      LucideAccessibility,
      LucideSparkles,
    ),
  ],
};