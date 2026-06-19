import { Routes } from '@angular/router';

import { authenticationGuard } from '../../guards/authentication.guard';
import { FullComponent } from './full.component';

export const FullLayoutRoutes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivateChild: [authenticationGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('../../pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('../../pages/ui-components/ui-components.routes').then(
            (m) => m.UiComponentsRoutes
          ),
      },
      {
        path: 'extra',
        loadChildren: () =>
          import('../../pages/extra/extra.routes').then((m) => m.ExtraRoutes),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('../../pages/ms-security/users/users.routes').then((m) => m.UsersRoutes),
      },
      {
        path: 'doctors',
        loadChildren: () =>
          import('../../pages/ms-clasificator/doctor/doctor.routes').then((m) => m.DoctorsRoutes),
      },
      {
        path: 'patients',
        loadChildren: () =>
          import('../../pages/ms-clasificator/patient/patient.routes').then((m) => m.PatientsRoutes),
      },
      {
        path: 'clinical-records',
        loadChildren: () =>
          import('../../pages/ms-clasificator/clinicalRecords/clinicalRecord.routes').then((m) => m.ClinicalRecordRoutes),
      },
      {
        path: 'evaluation-areas',
        loadChildren: () =>
          import('../../pages/ms-clasificator/evaluationArea/evaluation-area.routes').then((m) => m.EvaluationAreasRoutes),
      },
      {
        path: 'medical-diagnostics',
        loadChildren: () =>
          import('../../pages/ms-clasificator/medicalDiagnostic/medical-diagnostic.routes').then((m) => m.MedicalDiagnosticsRoutes),
      },
      {
        path: 'datasets',
        loadChildren: () =>
          import('../../pages/ms-clasificator/dataset/dataset.routes').then((m) => m.DatasetRoutes),
      },
      {
        path: 'system-data',
        loadChildren: () =>
          import('../../pages/ms-clasificator/systemData/system-data.routes').then((m) => m.SystemDataRoutes),
      },
      {
        path: 'classification',
        loadChildren: () =>
          import('../../pages/ms-clasificator/classification/classification.routes').then((m) => m.ClassificationRoutes),
      },
      {
        path: 'roles',
        loadChildren: () =>
          import('../../pages/ms-security/roles/roles.routes').then((m) => m.rolesRoutes),
      },
      {
        path: 'permissions',
        loadChildren: () =>
          import('../../pages/ms-security/permissions/permissions.routes').then((m) => m.permissionsRoutes),
      },
      {
        path: 'profile',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../../pages/profile/view/view.component').then((m) => m.ProfileViewComponent),
          },
          {
            path: 'edit',
            loadComponent: () =>
              import('../../pages/profile/profile.component').then((m) => m.ProfileComponent),
          },
        ],
      },
      {
        path: '**',
        redirectTo: '/dashboard',
      },
    ],
  },
];