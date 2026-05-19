import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { RolePermission } from '@app/models/RolePermission';
import { ApiResponse } from '@app/models/ms-clasificator/ApiResponse';

@Injectable({
  providedIn: 'root'
})
export class RolePermissionService {

  private apiUrl = `${environment.url_backend}/api/role-permission`;

  constructor(private http: HttpClient) {}

  // GET ALL PERMISSIONS FOR ROLES
  getRolePermissions(role_id:string): Observable<ApiResponse<RolePermission[]>> {
    return this.http.get<ApiResponse<RolePermission[]>>(`${this.apiUrl}/role/${role_id}`);
  }

  // ADD ROLE PERMISSION
  addRolePermission(roleId: string, permissionId: string): Observable<ApiResponse<RolePermission>> {
    return this.http.post<ApiResponse<RolePermission>>(`${this.apiUrl}/role/${roleId}/permission/${permissionId}`, {});
  }

  // REMOVE ROLE PERMISSION
  removeRolePermission(rolePermissionId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${rolePermissionId}`);
  }

}