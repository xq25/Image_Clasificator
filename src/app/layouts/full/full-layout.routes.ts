import { Routes } from '@angular/router';

import { authenticationGuard } from '../../guards/authentication.guard';
import { FullComponent } from './full.component';

export const FullLayoutRoutes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivateChild: [authenticationGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('../../pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('../../pages/ui-components/ui-components.routes').then(
            (m) => m.UiComponentsRoutes
          ),
      },
      {
        path: 'extra',
        loadChildren: () =>
          import('../../pages/extra/extra.routes').then((m) => m.ExtraRoutes),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('../../pages/ms-security/users/users.routes').then((m) => m.UsersRoutes),
      },
      {
        path: 'doctors',
        loadChildren: () =>
          import('../../pages/ms-clasificator/doctor/doctor.routes').then((m) => m.DoctorsRoutes),
      },
      {
        path: 'roles',
        loadChildren: () =>
          import('../../pages/ms-security/roles/roles.routes').then((m) => m.rolesRoutes),
      },
      {
        path: 'permissions',
        loadChildren: () =>
          import('../../pages/ms-security/permissions/permissions.routes').then((m) => m.permissionsRoutes),
      },
      {
        path: 'profile',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../../pages/profile/view/view.component').then((m) => m.ProfileViewComponent),
          },
          {
            path: 'edit',
            loadComponent: () =>
              import('../../pages/profile/profile.component').then((m) => m.ProfileComponent),
          },
        ],
      },
      {
        path: '**',
        redirectTo: '/dashboard',
      },
    ],
  },
];