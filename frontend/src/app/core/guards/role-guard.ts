import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const user = auth.user();
  const requiredRoles = route.data['roles'] as string[] | undefined;

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (!user || !requiredRoles.includes(user.role)) {
    router.navigate(['/feed']);
    return false;
  }

  return true;
};

// Helper guard for moderator+ access
export const moderatorGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const user = auth.user();
  if (!user || !['admin', 'moderator'].includes(user.role)) {
    router.navigate(['/feed']);
    return false;
  }

  return true;
};