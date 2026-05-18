import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { ManageComponent } from './manage/manage.component';
import { ManageSubDiagnosticComponent } from './manage-subdiagnostic/manage-subdiagnostic.component';

export const MedicalDiagnosticsRoutes: Routes = [
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
    path: 'sub-diagnostics/:id',
    component: ManageSubDiagnosticComponent
  }
];
