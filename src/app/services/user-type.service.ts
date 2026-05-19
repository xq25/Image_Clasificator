import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, Doctor, Patient } from '@models/ms-clasificator';

@Injectable({
  providedIn: 'root',
})
export class UserTypeService {
  private readonly apiUrl = `${environment.url_backend_clasificator}/api/public/user-type`;

  constructor(private http: HttpClient) {}

  assignDoctorRegister(userId: string,doctorInfo: Partial<Doctor>,): Observable<ApiResponse<Doctor>> {
    return this.http.put<ApiResponse<Doctor>>(
      `${this.apiUrl}/doctor/${userId}`,
      doctorInfo,
    );
  }

  assignPatientRegister(
    userId: string,
    patientInfo: Partial<Patient>,
  ): Observable<ApiResponse<Patient>> {
    return this.http.put<ApiResponse<Patient>>(
      `${this.apiUrl}/patient/${userId}`,
      patientInfo,
    );
  }
}
