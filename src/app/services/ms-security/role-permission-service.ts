import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { RolePermission } from '@app/models/RolePermission';

@Injectable({
  providedIn: 'root'
})
export class RolePermissionService {

  private apiUrl = `${environment.url_backend}/api/role-permission`;

  constructor(private http: HttpClient) {}

  // GET ALL PERMISSIONS FOR ROLES
  getRolePermissions(role_id:string): Observable<RolePermission[]> {
    return this.http.get<RolePermission[]>(`${this.apiUrl}/role/${role_id}`);
  }

  // ADD ROLE PERMISSION
  addRolePermission(roleId: string, permissionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/role/${roleId}/permission/${permissionId}`, {});
  }

  // REMOVE ROLE PERMISSION
  removeRolePermission(rolePermissionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${rolePermissionId}`);
  }

}