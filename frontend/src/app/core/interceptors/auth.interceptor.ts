import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/auth';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const token = auth.getToken();

  const isApiRequest =
    req.url.startsWith(environment.apiUrl) ||
    req.url.startsWith(environment.aiServiceUrl);

  const cloned =
    token && isApiRequest
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && isApiRequest) {
        auth.clearSession();
      }
      return throwError(() => err);
    }),
  );
};
