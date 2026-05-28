import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

/**
 * Guard de Role para a Área Admin (US-001)
 *
 * Verifica se o usuário autenticado possui o papel 'admin'.
 * Caso não possua, redireciona para /login com o parâmetro
 * redirect=/admin para retornar após autenticação correta.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  // Obtém o usuário atualmente autenticado pelo signal
  const usuario = auth.currentUser();

  // Verifica se o usuário possui o papel de administrador
  if (usuario?.role === 'admin') {
    return true;
  }

  // Redireciona para /login com parâmetro de retorno para /admin
  return router.parseUrl('/login?redirect=/admin');
};