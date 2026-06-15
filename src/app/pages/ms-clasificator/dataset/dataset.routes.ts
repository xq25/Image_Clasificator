import { Routes } from '@angular/router';

export const DatasetRoutes: Routes = [
  {
    path: 'create',
    loadComponent: () => import('./create/create.component').then(m => m.CreateDatasetComponent),
  },
];
