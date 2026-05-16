import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { ManageComponent } from './manage/manage.component';
import { ManageAreasComponent } from './manage-areas/manage-areas.component';

export const DoctorsRoutes: Routes = [
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
  },
  {
    path: 'edit/:id',
    component: ManageComponent
  },
  {
    path: 'doctor-areas/:id',
    component: ManageAreasComponent
  }
];