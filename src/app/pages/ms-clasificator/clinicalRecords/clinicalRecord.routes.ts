import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
export const ClinicalRecordRoutes: Routes = [
  {
    path: 'patient/:document/records',
    component: ListComponent,
  },
  {
    path: ':id/info/:patientId',
    loadComponent: () => import('./info/info.component').then(m => m.InfoComponent),
  },
];