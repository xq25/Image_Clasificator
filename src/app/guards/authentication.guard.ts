import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SecurityService } from '@app/services/ms-security/security';

export const authenticationGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const securityService = inject(SecurityService);
  const session = securityService.getCurrentSession();

  if (session?.token && session.active === true) {
    return true;
  }

  if (session?.code2FA === 'ON VALIDATION'){
    return router.createUrlTree(['/auth/validate2fa']);
  }

  return router.createUrlTree(['/auth/login']);
};
