import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SecurityService } from '@app/services/ms-security/security';

function isPublicAuthRoute(url: string): boolean {
  const normalizedUrl = url.split('?')[0];

  return [
    '/auth/validate2fa',
    '/auth/validate2FA',
    '/auth/validate2-fa',
    '/auth/authentication/validate2FA',
    '/auth/authentication/validate2-fa',
    '/reset-password',
  ].some((allowedUrl) => normalizedUrl.startsWith(allowedUrl));
}

export const noAuthenticationGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const securityService = inject(SecurityService);
  const session = securityService.getCurrentSession();

  if (!session?.token || session.active === false || session.token === 'NOT DEFINED') {
    return true;
  }

  if (session.active === true) {
    return router.createUrlTree(['/dashboard']);
  }

  if (isPublicAuthRoute(state.url)) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
