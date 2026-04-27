import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth-service';
import { User } from '../../types/user';

type AllowedRole = User['role'];

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowed = (route.data?.['roles'] ?? []) as AllowedRole[];
  const user = auth.getCurrentUser();

  // If route didn't declare roles, don't block.
  if (!allowed.length) return true;

  // Not logged in -> go to login.
  if (!user) {
    return router.createUrlTree(['/auth', 'login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (allowed.includes(user.role)) return true;

  // Logged in but wrong role -> unauthorized page.
  return router.createUrlTree(['/unauthorized'], {
    queryParams: {
      returnUrl: state.url,
      requiredRoles: allowed.join(','),
    },
  });
};
