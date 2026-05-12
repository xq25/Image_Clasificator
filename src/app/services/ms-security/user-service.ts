import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { User } from '@app/models/User';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = `${environment.url_backend}/api/users`;

  constructor(private http: HttpClient) {}

  // ===============================
  // GET ALL USERS
  // ===============================
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // ===============================
  // GET USER BY ID
  // ===============================
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // ===============================
  // CREATE USER
  // ===============================
  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  // ===============================
  // UPDATE USER
  // ===============================
  updateUser(id: string, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  // ===============================
  // DELETE USER
  // ===============================
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ===============================
  // ADD PROFILE TO USER
  // ===============================
  addProfileToUser(userId: string, profileId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${userId}/profile/${profileId}`,
      {}
    );
  }

  // ===============================
  // REMOVE PROFILE FROM USER
  // ===============================
  removeProfileFromUser(userId: string, profileId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${userId}/profile/${profileId}`
    );
  }

  // ===============================
  // ADD SESSION TO USER
  // ===============================
  addSessionToUser(userId: string, sessionId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${userId}/session/${sessionId}`,
      {}
    );
  }

  // ===============================
  // REMOVE SESSION FROM USER
  // ===============================
  removeSessionFromUser(userId: string, sessionId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${userId}/session/${sessionId}`
    );
  }

}