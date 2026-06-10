import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { ManagePermissionsComponent } from './manage-permissions/manage-permissions.component';

export const rolesRoutes: Routes = [
  {
    path: 'list',
    component: ListComponent
  },
  {
    path: 'role-permissions/:id',
    component: ManagePermissionsComponent
  }
];
