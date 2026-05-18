import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

import { environment } from '@environments/environment';
import { SidebarSection, NavCap } from '@app/models/sideBarRules';
import { SecurityService } from '@app/services/ms-security/security';
import { UserRoleService } from '@app/services/ms-security/user-role-service';

@Injectable({
  providedIn: 'root',
})
export class SideBarService {

  private readonly fullAccessRoleId = environment.securityRoles.fullAccessRoleId;
  private readonly securityAccessRoleId = environment.securityRoles.securityAccessRoleId;

  constructor(
    private securityService: SecurityService,
    private userRoleService: UserRoleService
  ) {}

  // Regla principal del sidebar por roles del usuario actual.
  getSideBarSections(): Observable<SidebarSection[]> {
    const userId = this.securityService.getCurrentSession()?.user?.id;

    if (!userId) {
      return of(this.buildSections(false, false));
    }

    return this.userRoleService.getUserRoles(userId).pipe(
      map((userRoles) =>
        userRoles.map((userRole) => userRole.role?.id).filter((roleId): roleId is string => !!roleId)
      ),
      map((roleIds) => {
        const hasFullAccess = roleIds.includes(this.fullAccessRoleId);
        const hasSecurityAccess = hasFullAccess || roleIds.includes(this.securityAccessRoleId);
        const hasClasificatorAccess = hasFullAccess;

        return this.buildSections(hasSecurityAccess, hasClasificatorAccess);
      }),
      catchError((error) => {
        console.error('[SideBarService] Error al obtener roles del usuario:', error);
        return of(this.buildSections(false, false));
      })
    );
  }

  private buildSections(hasSecurityAccess: boolean, hasClasificatorAccess: boolean): SidebarSection[] {
    const sections: SidebarSection[] = [
      {
        navCap: NavCap.HOME,
        visible: true,
        routes: [
          { displayName: 'Dashboard', iconName: 'solar:atom-line-duotone', route: '/dashboard', visible: true },
          { displayName: 'Profile', iconName: 'solar:user-circle-line-duotone', route: '/profile', visible: true }
        ]
      },
      {
        navCap: NavCap.SECURITY_ADMIN,
        visible: hasSecurityAccess,
        routes: [
          { displayName: 'Users', iconName: 'solar:users-group-rounded-line-duotone', route: '/users/list', visible: hasSecurityAccess },
          { displayName: 'Roles', iconName: 'solar:shield-line-duotone', route: '/roles/list', visible: hasSecurityAccess },
          { displayName: 'Permissions', iconName: 'solar:lock-keyhole-minimalistic-line-duotone', route: '/permissions/list', visible: hasSecurityAccess }
        ]
      },
      {
        navCap: NavCap.MANAGEMENT_CLASIFICATOR,
        visible: hasClasificatorAccess,
        routes: [
          { displayName: 'Patients', iconName: 'solar:user-heart-line-duotone', route: '/patients/list', visible: hasClasificatorAccess },
          { displayName: 'Evaluation Areas', iconName: 'solar:map-point-wave-line-duotone', route: '/evaluation-areas/list', visible: hasClasificatorAccess },
          { displayName: 'Doctors', iconName: 'solar:stethoscope-line-duotone', route: '/doctors/list', visible: hasClasificatorAccess },
          { displayName: 'Medical Diagnostics', iconName: 'solar:stethoscope-line-duotone', route: '/medical-diagnostics/list', visible: hasClasificatorAccess }
        ]
      }
    ];

    return sections
      .map((section) => ({
        ...section,
        routes: section.routes.filter((route) => route.visible)
      }))
      .filter((section) => section.visible && section.routes.length > 0);
  }
}
