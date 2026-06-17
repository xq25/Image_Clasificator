import { Routes } from '@angular/router';

export const ClassificationRoutes: Routes = [
  {
    path: ':imageTypeId',
    loadComponent: () => import('./classify.component').then(m => m.ClassifyComponent),
  },
];
