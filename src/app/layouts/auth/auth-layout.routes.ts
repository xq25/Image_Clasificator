import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout.component';
import { AppSideLoginComponent } from '../../pages/authentication/side-login/side-login.component';
import { AppSideRegisterComponent } from '../../pages/authentication/side-register/side-register.component';

export const AuthLayoutRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
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
        path: 'authentication',
        loadChildren: () =>
          import('../../pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
    ],
  },
];
