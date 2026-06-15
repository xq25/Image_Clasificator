import { Routes } from '@angular/router';

export const SystemDataRoutes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./list/list.component').then((m) => m.SystemDataListComponent),
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
];
