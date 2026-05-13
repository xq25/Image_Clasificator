import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { ManageComponent } from './manage/manage.component';
import { ManagePermissionsComponent } from './manage-permissions/manage-permissions.component';

export const rolesRoutes: Routes = [
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
    path: 'role-permissions/:id',
    component: ManagePermissionsComponent
  }
];
