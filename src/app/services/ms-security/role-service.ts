import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { Role } from '@app/models/Role';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private apiUrl = `${environment.url_backend}/api/roles`;

  constructor(private http: HttpClient) {}

  // ===============================
  // GET ALL ROLES
  // ===============================
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  // ===============================
  // GET ROLE BY ID
  // ===============================
  getRoleById(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  // ===============================
  // CREATE ROLE
  // ===============================
  createRole(role: Role): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, role);
  }

  // ===============================
  // UPDATE ROLE
  // ===============================
  updateRole(id: string, role: Role): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/${id}`, role);
  }

  // ===============================
  // DELETE ROLE
  // ===============================
  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}