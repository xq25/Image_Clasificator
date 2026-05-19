import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { User } from '@app/models/User';
import { ApiResponse } from '@app/models/ms-clasificator/ApiResponse';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = `${environment.url_backend}/api/users`;

  constructor(private http: HttpClient) {}

  // ===============================
  // GET ALL USERS
  // ===============================
  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(this.apiUrl);
  }

  // ===============================
  // GET USER BY ID
  // ===============================
  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`);
  }

  getUserByEmail(email: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/email/${email}`);
  }

  // ===============================
  // CREATE USER
  // ===============================
  createUser(user: User): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, user);
  }

  // ===============================
  // UPDATE USER
  // ===============================
  updateUser(id: string, user: User): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, user);
  }

  // ===============================
  // DELETE USER
  // ===============================
  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // ===============================
  // ADD PROFILE TO USER
  // ===============================
  addProfileToUser(userId: string, profileId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/${userId}/profile/${profileId}`,
      {}
    );
  }

  // ===============================
  // REMOVE PROFILE FROM USER
  // ===============================
  removeProfileFromUser(userId: string, profileId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${userId}/profile/${profileId}`
    );
  }

  // ===============================
  // ADD SESSION TO USER
  // ===============================
  addSessionToUser(userId: string, sessionId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/${userId}/session/${sessionId}`,
      {}
    );
  }

  // ===============================
  // REMOVE SESSION FROM USER
  // ===============================
  removeSessionFromUser(userId: string, sessionId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${userId}/session/${sessionId}`
    );
  }

}