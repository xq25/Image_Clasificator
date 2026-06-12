import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { ManageAreasComponent } from './manage-areas/manage-areas.component';

export const DoctorsRoutes: Routes = [
  {
    path: 'list',
    component: ListComponent
  },
  {
    path: 'doctor-areas/:id',
    component: ManageAreasComponent
  }
];