import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth.service';

/**
 * Guard de Role para a Área Admin (US-001)
 * Atualizado na US-026: redireciona para /403 se logado sem permissão
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  const usuario = auth.currentUser();

  // Possui papel admin — acesso liberado
  if (usuario?.role === 'admin') {
    return true;
  }

  // Logado mas sem permissão de admin → 403
  if (auth.isLoggedIn()) {
    return router.parseUrl('/403');
  }

  // Não logado → login com redirect
  return router.parseUrl('/login?redirect=/admin');
};