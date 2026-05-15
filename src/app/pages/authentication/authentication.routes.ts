import { Routes } from '@angular/router';

import { AppSideLoginComponent } from './side-login/side-login.component';
import { AppSideRegisterComponent } from './side-register/side-register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { Validate2FAComponent } from './validate2-fa/validate2-fa.component';

export const AuthenticationRoutes: Routes = [
  {
    path: '',
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
        path: 'forgot-password',
        component: ForgotPasswordComponent,
      },
      {
        path: 'forgot-password/:token',
        component: ForgotPasswordComponent,
      },
      {
        path: 'validate2FA',
        component: Validate2FAComponent,
      },
      {
        path: 'validate2fa',
        component: Validate2FAComponent,
      },
      {
        path: 'validate2-fa',
        component: Validate2FAComponent,
      },
    ],
  },
];
