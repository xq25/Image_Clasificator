import { Routes } from '@angular/router';
import { MedicalImageTypeListComponent } from './list/list.component';

export const MedicalImageTypeRoutes: Routes = [
  {
    path: 'list',
    component: MedicalImageTypeListComponent,
  },
];
