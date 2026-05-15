import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { Profile } from '@app/models/Profile';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private apiUrl = `${environment.url_backend}/api/profiles`;

  constructor(private http: HttpClient) {}

  // ===============================
  // GET ALL PROFILES
  // ===============================
  getProfiles(): Observable<Profile[]> {
    return this.http.get<Profile[]>(this.apiUrl);
  }

  // ===============================
  // GET PROFILE BY ID
  // ===============================
  getProfileById(id: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.apiUrl}/${id}`);
  }

  getProfileByUserID(user_id: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.apiUrl}/user/${user_id}`);
  }

  // ===============================
  // CREATE PROFILE
  // ===============================
  createProfile(profile: Profile): Observable<Profile> {
    return this.http.post<Profile>(this.apiUrl, profile);
  }

  // ===============================
  // UPDATE PROFILE
  // ===============================
  updateProfile(id: string, profile: Profile): Observable<Profile> {
    return this.http.put<Profile>(`${this.apiUrl}/${id}`, profile);
  }

  // ===============================
  // DELETE PROFILE
  // ===============================
  deleteProfile(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}