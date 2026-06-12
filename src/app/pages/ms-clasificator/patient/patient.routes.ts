import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';

export const PatientsRoutes: Routes = [
  {
    path: 'list',
    component: ListComponent
  }
];