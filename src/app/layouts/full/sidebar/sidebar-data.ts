import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Dashboard',
    iconName: 'solar:atom-line-duotone',
    route: '/dashboard',
  },
  {
    navCap: 'Security Admin',
  },
  {
    displayName: 'Users',
    iconName: 'solar:users-group-rounded-line-duotone',
    route: '/users/list',
  },
  {
    displayName: 'Roles',
    iconName: 'solar:shield-line-duotone',
    route: '/roles/list',
  },
  {
    displayName: 'Permissions',
    iconName: 'solar:lock-keyhole-minimalistic-line-duotone',
    route: '/permissions/list',
  },
  {
    navCap: 'Management Clasificator',
  },
  {
    displayName: 'Patients',
    iconName: 'solar:user-heart-line-duotone',
    route: '/patients/list',
  },
  {
    displayName: 'Evaluation Areas',
    iconName: 'solar:map-point-wave-line-duotone',
    route: '/evaluation-areas/list',
  },
  {
    displayName: 'Doctors',
    iconName: 'solar:stethoscope-line-duotone',
    route: '/doctors/list',
  },
  {
    displayName: 'Medical Diagnostics',
    iconName: 'solar:stethoscope-line-duotone',
    route: '/medical-diagnostics/list',
  },
  
  {
    displayName: 'Profile',
    iconName: 'solar:user-circle-line-duotone',
    route: '/profile',
  },


];
