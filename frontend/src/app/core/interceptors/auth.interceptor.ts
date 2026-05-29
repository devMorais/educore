import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { ToastService } from '../services/toast';
import { environment } from '../../../environments/environment';

/**
 * Interceptor HTTP Global (US-002)
 *
 * Intercepta todas as requisições HTTP e trata os erros de forma
 * centralizada, exibindo mensagens amigáveis ao usuário via ToastService.
 * Não exibe toast em rotas de polling (/status).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(Auth);
  const toast  = inject(ToastService);
  const router = inject(Router);
  const token  = auth.getToken();

  // Verifica se é uma requisição para nossas APIs
  const isApiRequest =
    req.url.startsWith(environment.apiUrl) ||
    req.url.startsWith(environment.aiServiceUrl);

  // Não exibe toast em rotas de polling
  const isPolling = req.url.includes('/status');

  // Adiciona o token de autenticação no header se existir
  const cloned =
    token && isApiRequest
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {

      // Trata erros apenas de requisições para nossas APIs
      if (isApiRequest && !isPolling) {
        switch (err.status) {

          case 401:
            // Sessão expirada: limpa sessão e redireciona para login
            auth.clearSession();
            router.navigate(['/login']);
            break;

          case 422:
            // Erros de validação: extrai e exibe cada mensagem
            const erros = err.error?.errors;
            if (erros) {
              Object.values(erros).forEach((mensagens: any) => {
                const lista = Array.isArray(mensagens) ? mensagens : [mensagens];
                lista.forEach((msg: string) => toast.erro(msg, 'Dados inválidos'));
              });
            } else {
              toast.erro(err.error?.message || 'Dados inválidos.', 'Atenção');
            }
            break;

          case 429:
            // Muitas tentativas
            toast.aviso('Muitas tentativas. Aguarde um momento.', 'Limite atingido');
            break;

          case 500:
            // Erro interno do servidor
            toast.erro('Erro interno. Tente novamente.', 'Erro no servidor');
            break;

          default:
            // Outros erros 4xx com mensagem do backend
            if (err.status >= 400 && err.error?.message) {
              toast.erro(err.error.message, 'Erro');
            }
            break;
        }
      }

      return throwError(() => err);
    }),
  );
};