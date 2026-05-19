import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { Profile } from '@app/models/Profile';
import { ApiResponse } from '@app/models/ms-clasificator/ApiResponse';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private apiUrl = `${environment.url_backend}/api/profiles`;
  private profilePhotoSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {}

  // ===============================
  // OBSERVER FOR PROFILE PHOTO CHANGES
  // ===============================
  get profilePhotoChanges(): Observable<string | null> {
    return this.profilePhotoSubject.asObservable();
  }

  setProfilePhoto(photo: string | null): void {
    this.profilePhotoSubject.next(photo);
  }

  // ===============================
  // GET ALL PROFILES
  // ===============================
  getProfiles(): Observable<ApiResponse<Profile[]>> {
    return this.http.get<ApiResponse<Profile[]>>(this.apiUrl);
  }

  // ===============================
  // GET PROFILE BY ID
  // ===============================
  getProfileById(id: string): Observable<ApiResponse<Profile>> {
    return this.http.get<ApiResponse<Profile>>(`${this.apiUrl}/${id}`);
  }

  getProfileByUserID(user_id: string): Observable<ApiResponse<Profile>> {
    return this.http.get<ApiResponse<Profile>>(`${this.apiUrl}/user/${user_id}`);
  }

  // ===============================
  // CREATE PROFILE
  // ===============================
  createProfile(profile: Profile): Observable<ApiResponse<Profile>> {
    return this.http.post<ApiResponse<Profile>>(this.apiUrl, profile);
  }

  // ===============================
  // UPDATE PROFILE
  // ===============================
  updateProfile(id: string, profile: Profile): Observable<ApiResponse<Profile>> {
    return this.http.put<ApiResponse<Profile>>(`${this.apiUrl}/${id}`, profile);
  }

  // ===============================
  // DELETE PROFILE
  // ===============================
  deleteProfile(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

}