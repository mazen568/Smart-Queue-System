import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth-service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.getCurrentUser();
  const token = auth.getToken() ?? user?.accessToken ?? null;

  if (token) return true;

  // Adjust this if your actual login route differs.
  return router.createUrlTree(['/auth', 'login'], {
    queryParams: { returnUrl: state.url },
  });
};
