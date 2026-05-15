import { Routes } from '@angular/router';
import { AuthLayoutRoutes } from './layouts/auth/auth-layout.routes';
import { FullLayoutRoutes } from './layouts/full/full-layout.routes';

export const routes: Routes = [
  ...AuthLayoutRoutes,
  ...FullLayoutRoutes,
];

