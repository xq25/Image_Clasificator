import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { ManageRolesComponent } from './manage-roles/manage-roles.component';

export const UsersRoutes: Routes = [
  {
    path: 'list',
    component: ListComponent
  },
  {
    path: 'user-roles/:id',
    component: ManageRolesComponent
  }
];
