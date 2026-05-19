import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { ManageComponent } from './manage/manage.component';
import { AssignPatientComponent } from './assign-patient/assign-patient.component';
import { ChangeAreaComponent } from './change-area/change-area.component';

export const MedicalImagesRoutes: Routes = [
  {
    path: 'list',
    component: ListComponent
  },
  {
    path: 'create',
    component: ManageComponent
  },
  {
    path: 'view/:id',
    component: ManageComponent
  }
  ,
  {
    path: 'assign-patient/:id',
    component: AssignPatientComponent
  },
  {
    path: 'change-area/:id',
    component: ChangeAreaComponent
  }
];