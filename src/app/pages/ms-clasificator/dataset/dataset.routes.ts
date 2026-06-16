import { Routes } from '@angular/router';

export const DatasetRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    loadComponent: () => import('./list/list.component').then(m => m.DatasetListComponent),
  },
  {
    path: 'create',
    loadComponent: () => import('./create/create.component').then(m => m.CreateDatasetComponent),
  },
];
