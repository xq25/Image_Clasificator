import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, Observable, throwError } from 'rxjs';

import { environment } from '@environments/environment';
import { Permission } from '@app/models/Permission';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  private apiUrl = `${environment.url_backend}/api/permissions`;

  constructor(private http: HttpClient) {}

  // ===============================
  // GET ALL PERMISSIONS
  // ===============================
  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.apiUrl);
  }

  // ===============================
  // GET PERMISSION BY ID
  // ===============================
  getPermissionById(id: string): Observable<Permission> {
    return this.http.get<Permission>(`${this.apiUrl}/${id}`);
  }

  // ===============================
  // CREATE PERMISSION
  // ===============================
  createPermission(permission: Permission): Observable<Permission> {
    return this.http.post<{ message: string; permission: Permission }>(this.apiUrl, permission).pipe(
      map(response => response.permission),
      catchError(error => {
        const message = error.error?.message || 'Validar error de generacion';
        return throwError(() => new Error(message));
      })
    );
  }

  // ===============================
  // UPDATE PERMISSION
  // ===============================
  updatePermission(id: string, permission: Permission): Observable<Permission> {
    return this.http.put<Permission>(`${this.apiUrl}/${id}`, permission);
  }

  // ===============================
  // DELETE PERMISSION
  // ===============================
  deletePermission(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}