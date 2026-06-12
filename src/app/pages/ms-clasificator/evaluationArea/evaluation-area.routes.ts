import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';

export const EvaluationAreasRoutes: Routes = [
  {
    path: 'list',
    component: ListComponent
  },
  // {
  //   path: 'manage-doctor-in-area/:id',
  //   component: ManageDoctorInAreaComponent
  // }
];