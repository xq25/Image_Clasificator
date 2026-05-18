import { Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { ManageComponent } from './manage/manage.component';
import { ManageStateComponent } from './manage-state/manage-state.component';

export const UIConfigRoutes: Routes = [
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
    path: 'manage-state/:id',
    component: ManageStateComponent
  }
];
