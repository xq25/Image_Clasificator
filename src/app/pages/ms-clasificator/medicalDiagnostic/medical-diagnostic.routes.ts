import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { ManageSubDiagnosticComponent } from './manage-subdiagnostic/manage-subdiagnostic.component';

export const MedicalDiagnosticsRoutes: Routes = [
  {
    path: 'list',
    component: ListComponent
  },
  {
    path: 'sub-diagnostics/:id',
    component: ManageSubDiagnosticComponent
  }
];
