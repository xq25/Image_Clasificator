import { Routes } from '@angular/router';

import { noAuthenticationGuard } from '../../guards/no-authentication.guard';
import { AuthLayoutComponent } from './auth-layout.component';
import { AppSideLoginComponent } from '../../pages/authentication/side-login/side-login.component';
import { AppSideRegisterComponent } from '../../pages/authentication/side-register/side-register.component';
import { Validate2FAComponent } from '../../pages/authentication/validate2-fa/validate2-fa.component';

export const AuthLayoutRoutes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivateChild: [noAuthenticationGuard],
    children: [
      {
        path: 'login',
        component: AppSideLoginComponent,
      },
      {
        path: 'register',
        component: AppSideRegisterComponent,
      },
      {
        path: 'validate2fa',
        component: Validate2FAComponent,
      },
      {
        path: 'authentication',
        loadChildren: () =>
          import('../../pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
    ],
  },
    {
      path: 'reset-password',
      component: AuthLayoutComponent,
      canActivate: [noAuthenticationGuard],
      children: [
        {
          path: '',
          loadComponent: () =>
            import('../../pages/authentication/forgot-password/forgot-password.component').then(
              (m) => m.ForgotPasswordComponent
            ),
        },
      ],
    },
];
