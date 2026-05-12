import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { Session } from '../../models/Session';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private apiUrl = `${environment.url_backend}/api/sessions`;

  constructor(private http: HttpClient) {}

  // ===============================
  // GET ALL SESSIONS
  // ===============================
  getSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(this.apiUrl);
  }

  // ===============================
  // GET SESSION BY ID
  // ===============================
  getSessionById(id: string): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/${id}`);
  }

  // ===============================
  // CREATE SESSION
  // ===============================
  createSession(session: Session): Observable<Session> {
    return this.http.post<Session>(this.apiUrl, session);
  }

  // ===============================
  // UPDATE SESSION
  // ===============================
  updateSession(id: string, session: Session): Observable<Session> {
    return this.http.put<Session>(`${this.apiUrl}/${id}`, session);
  }

  // ===============================
  // DELETE SESSION
  // ===============================
  deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}