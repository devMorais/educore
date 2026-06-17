import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { DemoService } from '../services/demo';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const demo = inject(DemoService);

  // Modo demo bypassa autenticação
  if (demo.isDemo()) return true;

  return auth.isLoggedIn() ? true : router.parseUrl('/login');
};