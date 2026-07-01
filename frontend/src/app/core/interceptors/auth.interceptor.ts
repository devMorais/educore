import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { Auth } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../../environments/environment';

/**
 * Interceptor HTTP Global
 *
 * - Injeta o Bearer token em todas as requisições para nossas APIs.
 * - Em caso de 401, tenta renovar o token via /auth/refresh (BS-007).
 *   Se o refresh falhar, limpa a sessão e redireciona para login.
 * - Trata demais erros de forma centralizada com ToastService.
 * - Não exibe toast em rotas de polling (/status).
 */

// Formato de erro de validação do Laravel: { errors: { campo: string | string[] } }
type LaravelValidationErrors = Record<string, string | string[]>;

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(Auth);
  const toast  = inject(ToastService);
  const router = inject(Router);
  const token  = auth.getToken();

  // Verifica se é uma requisição para nossas APIs
  const isApiRequest =
    req.url.startsWith(environment.apiUrl) ||
    req.url.startsWith(environment.aiServiceUrl);

  // Não exibe toast em rotas de polling e nem na própria rota de refresh
  const isPolling = req.url.includes('/status');
  const isRefreshReq = req.url.includes('/auth/refresh');

  // Injeta o token se existir
  const cloned = token && isApiRequest
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (isApiRequest && !isPolling) {
        if (err.status === 401 && !isRefreshReq && !isRefreshing) {
          // Tenta renovar o token antes de deslogar (BS-007)
          isRefreshing = true;
          return auth.refresh().pipe(
            switchMap((newToken: string) => {
              isRefreshing = false;
              const retried = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next(retried);
            }),
            catchError(() => {
              isRefreshing = false;
              auth.clearSession();
              router.navigate(['/login']);
              return throwError(() => err);
            }),
          );
        }

        if (err.status === 401) {
          auth.clearSession();
          router.navigate(['/login']);
        } else if (err.status === 422) {
          const erros = err.error?.errors as LaravelValidationErrors | undefined;
          if (erros) {
            Object.values(erros).forEach((mensagens) => {
              const lista = Array.isArray(mensagens) ? mensagens : [mensagens];
              lista.forEach((msg) => toast.erro(msg, 'Dados inválidos'));
            });
          } else {
            toast.erro(err.error?.message || 'Dados inválidos.', 'Atenção');
          }
        } else if (err.status === 429) {
          toast.aviso('Muitas tentativas. Aguarde um momento.', 'Limite atingido');
        } else if (err.status === 500) {
          toast.erro('Erro interno. Tente novamente.', 'Erro no servidor');
        } else if (err.status >= 400 && err.error?.message) {
          toast.erro(err.error.message, 'Erro');
        }
      }

      return throwError(() => err);
    }),
  );
};