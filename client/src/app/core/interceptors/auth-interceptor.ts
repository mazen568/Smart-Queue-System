import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth-service';
import { environment } from '../../../environments/environment';

let refreshInFlight = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

function isApiUrl(url: string) {
  return url.startsWith(environment.apiUrl);
}

function isAuthEndpoint(url: string) {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  
  const apiRequest = isApiUrl(req.url);
  const protectedRequest = apiRequest && !isAuthEndpoint(req.url);

  // Delay service retrieval to avoid circular dependency issues at startup
  const auth = injector.get(AuthService);
  const token = auth.getToken();

  // Enable cookie-based auth (needed for refresh cookie flow).
  let authReq = apiRequest ? req.clone({ withCredentials: true }) : req;

  // Add access token to protected API requests.
  if (protectedRequest && token) {
    authReq = authReq.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) return throwError(() => err);

      const is401 = err.status === 401;
      const canAttemptRefresh = apiRequest && !isAuthEndpoint(req.url);

      if (!is401 || !canAttemptRefresh) return throwError(() => err);

      // If refresh is already happening, wait for token then retry.
      if (refreshInFlight) {
        return refreshedToken$.pipe(
          filter((t): t is string => !!t),
          take(1),
          switchMap((newToken) => {
            const retryReq = req.clone({
              withCredentials: true,
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            return next(retryReq);
          })
        );
      }

      refreshInFlight = true;
      refreshedToken$.next(null);

      return auth.refreshToken().pipe(
        switchMap(() => {
          refreshInFlight = false;

          const newToken = auth.getToken();
          if (!newToken) return throwError(() => err);

          refreshedToken$.next(newToken);

          const retryReq = req.clone({
            withCredentials: true,
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });
          return next(retryReq);
        }),
        catchError((refreshErr) => {
          refreshInFlight = false;
          refreshedToken$.next(null);
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
