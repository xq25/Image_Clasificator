import { Routes } from '@angular/router';
import { FullComponent } from './layouts/full/full.component';
import { AuthLayoutComponent } from './layouts/auth/auth-layout.component';
import { AppSideLoginComponent } from './pages/authentication/side-login/side-login.component';
import { AppSideRegisterComponent } from './pages/authentication/side-register/side-register.component';

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('./pages/ui-components/ui-components.routes').then(
            (m) => m.UiComponentsRoutes
          ),
      },
      {
        path: 'extra',
        loadChildren: () =>
          import('./pages/extra/extra.routes').then((m) => m.ExtraRoutes),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./pages/ms-security/users/users.routes').then((m) => m.UsersRoutes),
      },
      {
        path: 'roles',
        loadChildren: () =>
          import('./pages/ms-security/roles/roles.routes').then((m) => m.rolesRoutes),
      }
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
    ],
  },
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: '**',
        redirectTo: '/dashboard',
      },
    ],
  },
];

