import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { UserRole } from '@app/models/UserRole';
import { ApiResponse } from '@app/models/ms-clasificator/ApiResponse';

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {

  private apiUrl = `${environment.url_backend}/api/user-role`;

  constructor(private http: HttpClient) {}

  // GET ALL ROLES BY USER
  getUserRoles(userId: string): Observable<ApiResponse<UserRole[]>> {
    return this.http.get<ApiResponse<UserRole[]>>(`${this.apiUrl}/user/${userId}`);
  }

  // ADD USER ROLE
  addUserRole(userId: string, roleId: string): Observable<ApiResponse<UserRole>> {
    return this.http.post<ApiResponse<UserRole>>(`${this.apiUrl}/user/${userId}/role/${roleId}`, {});
  }

  // REMOVE USER ROLE
  removeUserRole(userRoleId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${userRoleId}`);
  }

}