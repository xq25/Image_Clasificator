import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, Observable, throwError } from 'rxjs';

import { environment } from '@environments/environment';
import { Permission } from '@app/models/Permission';
import { ApiResponse } from '@app/models/ms-clasificator/ApiResponse';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  private apiUrl = `${environment.url_backend}/api/permissions`;

  constructor(private http: HttpClient) {}

  // ===============================
  // GET ALL PERMISSIONS
  // ===============================
  getPermissions(): Observable<ApiResponse<Permission[]>> {
    return this.http.get<ApiResponse<Permission[]>>(this.apiUrl);
  }

  // ===============================
  // GET PERMISSION BY ID
  // ===============================
  getPermissionById(id: string): Observable<ApiResponse<Permission>> {
    return this.http.get<ApiResponse<Permission>>(`${this.apiUrl}/${id}`);
  }

  // ===============================
  // CREATE PERMISSION
  // ===============================
  createPermission(permission: Permission): Observable<ApiResponse<Permission>> {
    return this.http.post<ApiResponse<Permission>>(this.apiUrl, permission).pipe(
      map((response) => response),
      catchError(error => {
        const message = error.error?.message || 'Validar error de generacion';
        return throwError(() => new Error(message));
      })
    );
  }

  // ===============================
  // UPDATE PERMISSION
  // ===============================
  updatePermission(id: string, permission: Permission): Observable<ApiResponse<Permission>> {
    return this.http.put<ApiResponse<Permission>>(`${this.apiUrl}/${id}`, permission);
  }

  // ===============================
  // DELETE PERMISSION
  // ===============================
  deletePermission(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

}