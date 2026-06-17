import { Routes } from '@angular/router';

export const ClassificationRoutes: Routes = [
  {
    path: ':datasetId',
    loadComponent: () => import('./classify.component').then(m => m.ClassifyComponent),
  },
];
