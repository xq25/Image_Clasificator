import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { Session } from '../../models/Session';
import { ApiResponse } from '@app/models/ms-clasificator/ApiResponse';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private apiUrl = `${environment.url_backend}/api/sessions`;

  constructor(private http: HttpClient) {}

  // ===============================
  // GET ALL SESSIONS
  // ===============================
  getSessions(): Observable<ApiResponse<Session[]>> {
    return this.http.get<ApiResponse<Session[]>>(this.apiUrl);
  }

  // ===============================
  // GET SESSION BY ID
  // ===============================
  getSessionById(id: string): Observable<ApiResponse<Session>> {
    return this.http.get<ApiResponse<Session>>(`${this.apiUrl}/${id}`);
  }

  // ===============================
  // CREATE SESSION
  // ===============================
  createSession(session: Session): Observable<ApiResponse<Session>> {
    return this.http.post<ApiResponse<Session>>(this.apiUrl, session);
  }

  // ===============================
  // UPDATE SESSION
  // ===============================
  updateSession(id: string, session: Session): Observable<ApiResponse<Session>> {
    return this.http.put<ApiResponse<Session>>(`${this.apiUrl}/${id}`, session);
  }

  // ===============================
  // DELETE SESSION
  // ===============================
  deleteSession(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

}