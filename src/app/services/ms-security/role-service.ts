import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { Role } from '@app/models/Role';
import { ApiResponse } from '@app/models/ms-clasificator/ApiResponse';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private apiUrl = `${environment.url_backend}/api/roles`;

  constructor(private http: HttpClient) {}

  // ===============================
  // GET ALL ROLES
  // ===============================
  getRoles(): Observable<ApiResponse<Role[]>> {
    return this.http.get<ApiResponse<Role[]>>(this.apiUrl);
  }

  // ===============================
  // GET ROLE BY ID
  // ===============================
  getRoleById(id: string): Observable<ApiResponse<Role>> {
    return this.http.get<ApiResponse<Role>>(`${this.apiUrl}/${id}`);
  }

  // ===============================
  // CREATE ROLE
  // ===============================
  createRole(role: Role): Observable<ApiResponse<Role>> {
    return this.http.post<ApiResponse<Role>>(this.apiUrl, role);
  }

  // ===============================
  // UPDATE ROLE
  // ===============================
  updateRole(id: string, role: Role): Observable<ApiResponse<Role>> {
    return this.http.put<ApiResponse<Role>>(`${this.apiUrl}/${id}`, role);
  }

  // ===============================
  // DELETE ROLE
  // ===============================
  deleteRole(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

}