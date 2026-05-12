import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { UserRole } from '@app/models/UserRole';

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {

  private apiUrl = `${environment.url_backend}/api/user-role`;

  constructor(private http: HttpClient) {}

  // GET ALL ROLES BY USER
  getUserRoles(userId: string): Observable<UserRole[]> {
    return this.http.get<UserRole[]>(`${this.apiUrl}/user/${userId}`);
  }

  // ADD USER ROLE
  addUserRole(userId: string, roleId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/${userId}/role/${roleId}`, {});
  }

  // REMOVE USER ROLE
  removeUserRole(userRoleId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userRoleId}`);
  }

}