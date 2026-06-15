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
  {
    path: ':id/upload/:patientId',
    loadComponent: () => import('./upload/upload.component').then(m => m.UploadComponent),
  },
];