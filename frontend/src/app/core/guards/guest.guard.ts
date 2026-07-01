import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth.service';

/**
 * Guard de Convidado
 *
 * Bloqueia acesso às rotas públicas (login, cadastro, etc.)
 * para usuários já autenticados.
 * - Admin autenticado é redirecionado para /admin (US-001)
 * - Usuário comum autenticado é redirecionado para /painel
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return true;
  }

  // Admin autenticado vai para a área administrativa
  const usuario = auth.currentUser();
  if (usuario?.role === 'admin') {
    return router.parseUrl('/admin');
  }

  // Usuário comum autenticado vai para o painel
  return router.parseUrl('/painel');
};